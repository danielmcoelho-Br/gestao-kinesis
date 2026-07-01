// content.js - Scraper de dados de atendimento do SeuFisio

window.syncLogs = window.syncLogs || [];
function log(msg) {
  console.log("[Kinesis Sync Content Script]", msg);
  const timestamp = new Date().toLocaleTimeString();
  window.syncLogs.push(`[${timestamp}] ${msg}`);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// // Checa automaticamente se há uma sincronização pendente/ativa ao carregar a página
if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(["syncState", "serverUrl", "syncToken"], (result) => {
    if (result.syncState && result.syncState.active) {
      log("Sincronização em andamento detectada. Aguardando a tabela renderizar...");
      waitForTableToRender().then((hasTable) => {
        if (hasTable) {
          resumeSync(result.syncState, result.serverUrl, result.syncToken);
        } else {
          log("Erro: A tabela de atendimentos não renderizou no tempo limite.");
          chrome.storage.local.set({ syncState: { active: false } });
          chrome.runtime.sendMessage({
            action: "syncError",
            error: "Tabela de atendimentos não carregou a tempo no reload da página."
          }).catch(() => {});
        }
      });
    }
  });
}

// Escuta comandos manuais de start
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startSync") {
    chrome.storage.local.get(["syncState", "serverUrl", "syncToken"], (result) => {
      resumeSync(result.syncState, result.serverUrl, result.syncToken);
    });
  }
  return true;
});

function normalizeText(text) {
  if (!text) return "";
  return text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getTargetTable() {
  const tables = Array.from(document.querySelectorAll("table"));
  for (const table of tables) {
    const headers = Array.from(table.querySelectorAll("th, td[class*='header'], tr:first-child td")).map(cell => cell.textContent.trim());
    if (headers.length === 0) continue;
    const normHeaders = headers.map(normalizeText);
    const dataIdx = normHeaders.findIndex(h => h.includes("data") || h.includes("hora"));
    const profIdx = normHeaders.findIndex(h => h.includes("profissional") || h.includes("fisioterapeuta"));
    const clientIdx = normHeaders.findIndex(h => h.includes("cliente") || h.includes("paciente"));
    if (dataIdx !== -1 && profIdx !== -1 && clientIdx !== -1) {
      return { table, dataIdx, profIdx, clientIdx, normHeaders };
    }
  }
  return null;
}

function getCellText(cell) {
  if (!cell) return "";
  // innerText respects <br> line breaks and returns them as \n. textContent just glues them.
  const rawText = cell.innerText !== undefined ? cell.innerText : cell.textContent;
  return (rawText || "").replace(/\r?\n/g, " ").trim().replace(/\s+/g, " ");
}

function scrapeActivePage() {
  log("Iniciando escaneamento da página ativa...");
  const tableInfo = getTargetTable();
  
  if (!tableInfo) {
    throw new Error("Tabela do SeuFisio não encontrada. Certifique-se de que você está na página de relatório de atendimentos contendo as colunas 'Data', 'Profissional' e 'Cliente'.");
  }

  const { table, dataIdx, profIdx, clientIdx, normHeaders } = tableInfo;
  
  const statusIdx = normHeaders.findIndex(h => h.includes("status") || h.includes("situacao"));
  const valIdx = normHeaders.findIndex(h => h.includes("valor") || h.includes("preco"));
  const tipoIdx = normHeaders.findIndex(h => h.includes("tipo") || h.includes("servico") || h.includes("procedimento"));

  const columnMapping = {
    data: dataIdx,
    professional: profIdx,
    cliente: clientIdx,
    status: statusIdx !== -1 ? statusIdx : null,
    valor: valIdx !== -1 ? valIdx : null,
    tipo: tipoIdx !== -1 ? tipoIdx : null
  };

  const rows = Array.from(table.querySelectorAll("tbody tr, tr:not(:first-child)"));
  const atendimentos = [];

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("td"));
    if (cells.length === 0 || cells.length <= Math.max(columnMapping.data, columnMapping.professional, columnMapping.cliente)) {
      continue;
    }

    const data = getCellText(cells[columnMapping.data]);
    const professional = getCellText(cells[columnMapping.professional]);
    const cliente = getCellText(cells[columnMapping.cliente]);

    if (!data || !professional || !cliente) {
      continue;
    }

    const normLine = normalizeText(row.textContent);
    if (normLine.includes("saldo") || normLine.includes("total") || normLine.includes("resumo")) {
      continue;
    }

    const status = columnMapping.status !== null ? getCellText(cells[columnMapping.status]) : "Finalizado";
    const tipo = columnMapping.tipo !== null ? getCellText(cells[columnMapping.tipo]) : "Fisioterapia";
    const rawValor = columnMapping.valor !== null ? getCellText(cells[columnMapping.valor]) : "0,00";

    let valor = 0;
    const cleanVal = rawValor.replace(/[^\d\.,-]/g, "");
    if (cleanVal) {
      if (cleanVal.includes(",") && cleanVal.includes(".")) {
        valor = parseFloat(cleanVal.replace(/\./g, "").replace(",", "."));
      } else if (cleanVal.includes(",")) {
        valor = parseFloat(cleanVal.replace(",", "."));
      } else {
        valor = parseFloat(cleanVal);
      }
    }
    if (isNaN(valor)) valor = 0;

    atendimentos.push({
      data,
      professional,
      cliente,
      status,
      tipo,
      valor
    });
  }

  return atendimentos;
}

function isElementInHeaderOrSidebar(el) {
  if (!el) return false;
  return !!el.closest("header, #header, .header, .q-header, q-header, sidebar, #sidebar, .sidebar, .q-drawer, q-drawer, aside, nav, .q-menu, .q-dialog, [class*='menu-bar'], [class*='nav-bar'], [class*='menu-container'], [class*='sidebar-'], .q-tabs, .q-tab, [class*='q-tabs']");
}

function isElementInsideTableHeader(el) {
  if (!el) return false;
  return !!el.closest("thead, tr:first-child, th");
}

function findNextPageButton(pageCount) {
  const tableInfo = getTargetTable();
  const searchRoot = tableInfo ? (tableInfo.table.closest(".q-table__container, .q-table, [class*='table-wrapper'], [class*='table-container']") || tableInfo.table.parentElement || document) : document;

  const selectors = [
    "a[rel='next']",
    "a[aria-label*='Next']",
    "a[aria-label*='next']",
    "a[aria-label*='Próximo']",
    "a[aria-label*='próximo']",
    "a[aria-label*='Próxima']",
    "a[aria-label*='próxima']",
    "a[aria-label*='Proximo']",
    "a[aria-label*='proximo']",
    "a[aria-label*='Proxima']",
    "a[aria-label*='proxima']",
    "button[class*='next']",
    "a[class*='next']",
    ".pagination .next a",
    ".pagination-next",
    "li.next a",
    "button[id*='next']",
    "[class*='pagination'] [class*='next']",
    "[class*='page-item'] [class*='next']",
    "[class*='next-page']",
    "[class*='chevron-right']",
    "[class*='angle-right']",
    "[class*='arrow-right']"
  ];

  for (const sel of selectors) {
    try {
      const elements = Array.from(searchRoot.querySelectorAll(sel));
      for (const el of elements) {
        if (isElementInHeaderOrSidebar(el) || isElementInsideTableHeader(el)) {
          continue;
        }
        if (!el.closest(".disabled") && !el.disabled && !el.classList.contains("disabled") && !el.getAttribute("disabled")) {
          log(`Botão próximo encontrado via seletor: ${sel}`);
          return el;
        }
      }
    } catch (e) {
      // Ignore invalid selectors if any
    }
  }

  // Query all potential page elements, but exclude generic divs/spans that aren't styled as buttons/items
  const elements = Array.from(searchRoot.querySelectorAll("button, a, .q-btn, [role='button'], .page-link, .page-item, span, li, div"));
  for (const el of elements) {
    if (isElementInHeaderOrSidebar(el) || isElementInsideTableHeader(el)) {
      continue;
    }
    
    // Skip parent wrappers if they contain another specific interactive button/link/item
    if (el.querySelector("button, a, .q-btn, [role='button'], .page-link, .page-item")) {
      continue;
    }

    const text = el.textContent.trim().toLowerCase();
    const normText = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const className = el.className && typeof el.className === "string" ? el.className.toLowerCase() : "";
    
    // Check if the text matches next-page keywords (including Quasar's chevron_right!)
    if ((normText.includes("proxim") || normText === ">" || normText === "»" || normText.includes("next") || normText.includes("chevron_right") || normText.includes("chevron-right") || normText.includes("arrow_right") || normText.includes("arrow-right")) && 
        (el.tagName === "A" || el.tagName === "BUTTON" || el.onclick || className.includes("page-link") || className.includes("page-item") || className.includes("page") || className.includes("btn") || className.includes("pag") || className.includes("q-btn"))) {
      if (!el.closest(".disabled") && !el.disabled && !el.classList.contains("disabled") && !el.getAttribute("disabled")) {
        log(`Botão próximo encontrado via texto/tag: "${text}"`);
        return el;
      }
    }
  }

  // Fallback: Busca pela página numérica seguinte (ex: texto é "2" se estamos na pág 1)
  if (pageCount) {
    const nextPageStr = (pageCount + 1).toString();
    for (const el of elements) {
      if (isElementInHeaderOrSidebar(el) || isElementInsideTableHeader(el)) {
        continue;
      }
      
      // Skip parent wrappers if they contain another specific interactive button/link/item
      if (el.querySelector("button, a, .q-btn, [role='button'], .page-link, .page-item")) {
        continue;
      }

      const text = el.textContent.trim();
      const className = el.className && typeof el.className === "string" ? el.className.toLowerCase() : "";
      
      if (text === nextPageStr && 
          (el.tagName === "A" || el.tagName === "BUTTON" || el.onclick || className.includes("page") || className.includes("btn") || className.includes("pag") || className.includes("q-btn") || el.classList.contains("page-link") || el.classList.contains("page-item"))) {
        if (!el.closest(".disabled") && !el.disabled && !el.classList.contains("disabled") && !el.getAttribute("disabled")) {
          log(`Encontrado botão numérico da página: ${nextPageStr}`);
          return el;
        }
      }
    }
  }

  // Look for any icon element that is not in header/sidebar
  const potentialIcons = Array.from(searchRoot.querySelectorAll("i, svg, span, img"));
  for (const icon of potentialIcons) {
    if (isElementInHeaderOrSidebar(icon) || isElementInsideTableHeader(icon)) {
      continue;
    }
    const className = icon.className && typeof icon.className === "string" ? icon.className.toLowerCase() : "";
    const id = icon.id && typeof icon.id === "string" ? icon.id.toLowerCase() : "";
    if (className.includes("right") || className.includes("next") || id.includes("right") || id.includes("next")) {
      const parentButton = icon.closest("button, a, .q-btn, [role='button'], .page-link, .page-item, div, span");
      if (parentButton && !parentButton.closest(".disabled") && !parentButton.disabled && !parentButton.classList.contains("disabled")) {
        log(`Botão próximo encontrado via ícone: ${className || id}`);
        return parentButton;
      }
    }
  }

  return null;
}

function findFirstPageButton() {
  const tableInfo = getTargetTable();
  const searchRoot = tableInfo ? (tableInfo.table.closest(".q-table__container, .q-table, [class*='table-wrapper'], [class*='table-container']") || tableInfo.table.parentElement || document) : document;

  const elements = Array.from(searchRoot.querySelectorAll("button, a, .q-btn, [role='button'], .page-link, .page-item, span, li, div"));
  for (const el of elements) {
    if (isElementInHeaderOrSidebar(el) || isElementInsideTableHeader(el)) {
      continue;
    }
    // Skip parent wrappers if they contain another specific interactive button/link/item
    if (el.querySelector("button, a, .q-btn, [role='button'], .page-link, .page-item")) {
      continue;
    }

    const text = el.textContent.trim().toLowerCase();
    const className = el.className && typeof el.className === "string" ? el.className.toLowerCase() : "";
    
    // Check if the text matches first-page keywords (including Quasar's first_page)
    if ((text === "first_page" || text === "««" || text.includes("first")) && 
        (el.tagName === "A" || el.tagName === "BUTTON" || el.onclick || className.includes("page-link") || className.includes("page-item") || className.includes("page") || className.includes("btn") || className.includes("pag") || className.includes("q-btn"))) {
      if (!el.closest(".disabled") && !el.disabled && !el.classList.contains("disabled") && !el.getAttribute("disabled")) {
        return el;
      }
    }
  }
  return null;
}

function itemSignature(item) {
  return `${item.data}_${item.professional}_${item.cliente}_${item.tipo}_${item.status}_${item.valor}`;
}

function simulateClick(el) {
  if (!el) return;
  log(`Clicando no elemento: <${el.tagName}> (texto: "${el.textContent.trim()}")`);
  try {
    el.click();
  } catch (err) {
    log("Erro ao chamar el.click(): " + err.message);
  }
  try {
    const ev = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window
    });
    el.dispatchEvent(ev);
  } catch (err) {
    log("Erro ao disparar MouseEvent: " + err.message);
  }
}

function waitForTableToRender() {
  return new Promise((resolve) => {
    if (getTargetTable()) {
      resolve(true);
      return;
    }
    
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (getTargetTable()) {
        clearInterval(interval);
        resolve(true);
      } else if (attempts >= 100) { // 10 segundos
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });
}

function getCurrentPageSignatures() {
  const tableInfo = getTargetTable();
  if (!tableInfo) return [];
  const { table, dataIdx, profIdx, clientIdx } = tableInfo;
  const rows = Array.from(table.querySelectorAll("tbody tr, tr:not(:first-child)"));
  const signatures = [];
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll("td"));
    if (cells.length === 0 || cells.length <= Math.max(dataIdx, profIdx, clientIdx)) {
      continue;
    }
    const data = getCellText(cells[dataIdx]);
    const professional = getCellText(cells[profIdx]);
    const cliente = getCellText(cells[clientIdx]);
    if (data && professional && cliente) {
      const normLine = normalizeText(row.textContent);
      if (normLine.includes("saldo") || normLine.includes("total") || normLine.includes("resumo")) {
        continue;
      }
      signatures.push(`${data}_${professional}_${cliente}`);
    }
  }
  return signatures;
}

function getTableSampleText() {
  const tableInfo = getTargetTable();
  if (!tableInfo) return "";
  const tbody = tableInfo.table.querySelector("tbody") || tableInfo.table;
  return tbody.textContent || tbody.innerText || "";
}

function waitForTableAJAXUpdate(oldSignatures, maxWaitMs = 15000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      const currentSignatures = getCurrentPageSignatures();
      const currentText = normalizeText(getTableSampleText());
      
      const isLoading = currentText.includes("carregando") || 
                        currentText.includes("processando") || 
                        currentText.includes("aguarde") ||
                        currentText.includes("loading");
      
      const signaturesChanged = JSON.stringify(currentSignatures) !== JSON.stringify(oldSignatures);
      
      if (signaturesChanged && currentSignatures.length > 0 && !isLoading) {
        log(`Tabela atualizada detectada com ${currentSignatures.length} itens.`);
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime >= maxWaitMs) {
        log("Timeout atingido aguardando atualização da tabela.");
        resolve(false);
        return;
      }
      
      setTimeout(check, 150);
    };
    
    setTimeout(check, 150);
  });
}

function getPaginationElementsDebug() {
  try {
    const elList = Array.from(document.querySelectorAll("a, button, .pagination, [class*='pagin'], [class*='pager'], [class*='page']"));
    const matches = [];
    for (const el of elList) {
      const text = el.textContent.trim().replace(/\s+/g, " ");
      const className = el.className && typeof el.className === "string" ? el.className : "";
      const id = el.id || "";
      
      // Captura todos os botões, links ou elementos com classes relacionadas a páginas
      if (el.tagName === "A" || el.tagName === "BUTTON" || className.includes("pagin") || className.includes("page")) {
        matches.push({
          tagName: el.tagName,
          text: text.substring(0, 100),
          className: className.substring(0, 150),
          id: id,
          outerHTML: el.outerHTML.substring(0, 250)
        });
      }
    }
    return matches;
  } catch (e) {
    return [{ error: e.message }];
  }
}

async function finalizarSync(totalAtendimentos, syncState, serverUrl, syncToken) {
  log(`Enviando total consolidado de ${totalAtendimentos.length} atendimentos para ${serverUrl}...`);
  
  chrome.runtime.sendMessage({
    action: "syncStatus",
    message: `Enviando ${totalAtendimentos.length} atendimentos consolidando todas as páginas...`,
    badge: "Enviando..."
  }).catch(() => {});

  const response = await fetch(`${serverUrl}/api/financeiro/seufisio-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${syncToken}`
    },
    body: JSON.stringify({
      month: syncState.month,
      year: syncState.year,
      atendimentos: totalAtendimentos,
      debugHtml: JSON.stringify(getPaginationElementsDebug(), null, 2),
      logs: window.syncLogs
    })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Erro ao salvar no servidor.");

  log(`Sucesso! ${result.importedCount} registros importados no total.`);
  
  // Limpa estado de sincronização
  await chrome.storage.local.set({ syncState: { active: false } });

  chrome.runtime.sendMessage({
    action: "syncComplete",
    importedCount: result.importedCount,
    message: result.message
  }).catch(() => {});
}

async function resumeSync(syncState, serverUrl, syncToken) {
  if (window.isKinesisSyncRunning) {
    log("Aviso: resumeSync já está em execução nesta aba. Abortando chamada duplicada.");
    return;
  }
  window.isKinesisSyncRunning = true;
  try {
    // Se for o início (página 1), garante que estamos de fato na primeira página do relatório
    if (syncState.pageCount === 1) {
      const firstPageBtn = findFirstPageButton();
      if (firstPageBtn) {
        log("Aviso: Detectado que a página atual não é a primeira. Voltando para a primeira página do relatório...");
        const oldSignatures = getCurrentPageSignatures();
        simulateClick(firstPageBtn);
        log("Aguardando carregamento da primeira página...");
        const page1Loaded = await waitForTableAJAXUpdate(oldSignatures, 15000);
        if (page1Loaded) {
          log("Primeira página do relatório carregada com sucesso.");
          await sleep(500);
        } else {
          log("Aviso: Timeout ao tentar voltar para a primeira página. Continuando com a página atual.");
        }
      }
    }

    log(`Iniciando varredura da página ${syncState.pageCount}...`);
    
    // 1. Raspa a página ativa
    const pageData = scrapeActivePage();
    
    // 2. Filtra duplicados baseados na assinatura (caso ocorra reload ou double-trigger)
    const existingSignatures = new Set(syncState.atendimentos.map(itemSignature));
    const uniqueNewItems = [];
    
    for (const item of pageData) {
      const sig = itemSignature(item);
      if (!existingSignatures.has(sig)) {
        uniqueNewItems.push(item);
      }
    }
    
    const totalAtendimentos = syncState.atendimentos.concat(uniqueNewItems);
    log(`Lidos ${uniqueNewItems.length} novos atendimentos nesta página. Total acumulado: ${totalAtendimentos.length}`);

    // 3. Verifica se há uma próxima página
    const nextBtn = findNextPageButton(syncState.pageCount);
    
    if (nextBtn) {
      log(`Próxima página detectada. Avançando...`);
      
      const newSyncState = {
        active: true,
        month: syncState.month,
        year: syncState.year,
        atendimentos: totalAtendimentos,
        pageCount: syncState.pageCount + 1
      };
      
      // Atualiza o estado na storage antes de navegar
      await chrome.storage.local.set({ syncState: newSyncState });
      
      // Envia notificação de progresso
      chrome.runtime.sendMessage({
        action: "syncProgress",
        pageCount: newSyncState.pageCount,
        count: totalAtendimentos.length
      }).catch(() => {});

      // Salva assinaturas da página atual para comparar após navegação
      const oldSignatures = getCurrentPageSignatures();

      // Clica simulando clique real do mouse (dispara os listeners de React/Vue)
      simulateClick(nextBtn);
      
      // Aguarda atualização da tabela (AJAX) ou recarregamento
      log("Aguardando alteração ou recarregamento da tabela...");
      const ajaxUpdated = await waitForTableAJAXUpdate(oldSignatures, 15000);
      
      if (ajaxUpdated) {
        log("Tabela atualizada via AJAX. Continuando varredura em 500ms...");
        await sleep(500);
        chrome.storage.local.get(["syncState", "serverUrl", "syncToken"], (result) => {
          resumeSync(result.syncState, result.serverUrl, result.syncToken);
        });
      } else {
        log("Aguardando 2 segundos para ver se a página está realizando um Full Reload...");
        await sleep(2000);
        // Se o contexto JS ainda estiver vivo após 2s, foi um timeout real do AJAX.
        // Finaliza o envio com os dados acumulados até aqui.
        log("Timeout atingido. Finalizando sincronização com os registros atuais...");
        await finalizarSync(totalAtendimentos, syncState, serverUrl, syncToken);
      }
    } else {
      // 4. Chegamos ao fim! Envia tudo
      log(`Varredura completa! Fim das páginas alcançado.`);
      await finalizarSync(totalAtendimentos, syncState, serverUrl, syncToken);
    }
  } catch (err) {
    log("Erro no processo de sincronização: " + err.message);
    await chrome.storage.local.set({ syncState: { active: false } });
    
    chrome.runtime.sendMessage({
      action: "syncError",
      error: err.message
    }).catch(() => {});
  } finally {
    window.isKinesisSyncRunning = false;
  }
}

