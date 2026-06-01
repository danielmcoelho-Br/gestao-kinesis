// popup.js - Controle e fluxo de envio da Extensão SeuFisio Sync

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const monthSelect = document.getElementById("month");
  const yearSelect = document.getElementById("year");
  const syncBtn = document.getElementById("syncBtn");
  const statusBadge = document.getElementById("statusBadge");
  const logBox = document.getElementById("logBox");
  
  const toggleConfig = document.getElementById("toggleConfig");
  const configArea = document.getElementById("configArea");
  const serverUrlInput = document.getElementById("serverUrl");
  const syncTokenInput = document.getElementById("syncToken");
  
  const toggleFallback = document.getElementById("toggleFallback");
  const fallbackArea = document.getElementById("fallbackArea");
  const rawTextInput = document.getElementById("rawText");
  const parseRawBtn = document.getElementById("parseRawBtn");

  // Clear initial log
  logBox.textContent = "";

  // Log function (Scrolls to bottom naturally)
  function writeLog(text, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    logBox.textContent = logBox.textContent + `[${timestamp}] ${text}\n`;
    logBox.scrollTop = logBox.scrollHeight; // Force scroll to bottom!
    if (isError) {
      statusBadge.textContent = "Erro!";
      statusBadge.style.color = "#ef4444";
      statusBadge.style.background = "rgba(239, 68, 68, 0.1)";
      statusBadge.style.borderColor = "rgba(239, 68, 68, 0.2)";
    }
  }

  // Pre-select current month/year
  const now = new Date();
  monthSelect.value = now.getMonth().toString();
  yearSelect.value = now.getFullYear().toString();

  // Collapsible areas
  toggleConfig.addEventListener("click", () => {
    const isHidden = configArea.style.display === "none";
    configArea.style.display = isHidden ? "block" : "none";
    toggleConfig.querySelector("span:last-child").textContent = isHidden ? "▲" : "▼";
  });

  toggleFallback.addEventListener("click", () => {
    const isHidden = fallbackArea.style.display === "none";
    fallbackArea.style.display = isHidden ? "block" : "none";
    toggleFallback.querySelector("span:last-child").textContent = isHidden ? "▲" : "▼";
  });

  // Load saved configurations from localStorage / chrome.storage
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["serverUrl", "syncToken"], (res) => {
      if (res.serverUrl) serverUrlInput.value = res.serverUrl;
      if (res.syncToken) syncTokenInput.value = res.syncToken;
    });
  } else {
    // Development/Browser mock fallback
    const savedUrl = localStorage.getItem("serverUrl");
    const savedToken = localStorage.getItem("syncToken");
    if (savedUrl) serverUrlInput.value = savedUrl;
    if (savedToken) syncTokenInput.value = savedToken;
  }

  // Save configurations on edit
  function saveConfig() {
    const url = serverUrlInput.value.trim();
    const token = syncTokenInput.value.trim();
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ serverUrl: url, syncToken: token });
    } else {
      localStorage.setItem("serverUrl", url);
      localStorage.setItem("syncToken", token);
    }
  }

  serverUrlInput.addEventListener("input", saveConfig);
  syncTokenInput.addEventListener("input", saveConfig);

  // Restaura o estado da sincronização ao abrir o popup
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["syncState"], (res) => {
      if (res.syncState && res.syncState.active) {
        statusBadge.textContent = "Sincronizando...";
        statusBadge.style.color = "#fbbf24";
        statusBadge.style.background = "rgba(251, 191, 36, 0.1)";
        statusBadge.style.borderColor = "rgba(251, 191, 36, 0.2)";
        writeLog(`Sincronização em andamento (Página ${res.syncState.pageCount}, ${res.syncState.atendimentos.length} atendimentos)...`);
      }
    });
  }

  // Listener para mensagens de progresso do script de conteúdo
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === "syncProgress") {
        writeLog(`Varrendo páginas... Lidos ${msg.count} atendimentos até a pág. ${msg.pageCount}`);
      } else if (msg.action === "syncStatus") {
        writeLog(msg.message);
        if (msg.badge) {
          statusBadge.textContent = msg.badge;
        }
      } else if (msg.action === "syncComplete") {
        writeLog(`SUCESSO! ${msg.importedCount} registros importados.`);
        statusBadge.textContent = "Sincronizado!";
        statusBadge.style.color = "#10b981";
        statusBadge.style.background = "rgba(16, 185, 129, 0.1)";
        statusBadge.style.borderColor = "rgba(16, 185, 129, 0.2)";
      } else if (msg.action === "syncError") {
        writeLog(msg.error, true);
      }
    });
  }

  // Enviar dados em modo manual/fallback
  async function sendToKinesis(atendimentos) {
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearSelect.value);
    const serverUrl = serverUrlInput.value.trim();
    const token = syncTokenInput.value.trim();

    writeLog(`Enviando ${atendimentos.length} atendimentos para Kinesis App...`);
    statusBadge.textContent = "Sincronizando...";
    statusBadge.style.color = "#fbbf24";
    statusBadge.style.background = "rgba(251, 191, 36, 0.1)";
    statusBadge.style.borderColor = "rgba(251, 191, 36, 0.2)";

    try {
      const response = await fetch(`${serverUrl}/api/financeiro/seufisio-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          month,
          year,
          atendimentos
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro de servidor desconhecido.");

      writeLog(`SUCESSO! ${result.importedCount} registros importados.`);
      statusBadge.textContent = "Sincronizado!";
      statusBadge.style.color = "#10b981";
      statusBadge.style.background = "rgba(16, 185, 129, 0.1)";
      statusBadge.style.borderColor = "rgba(16, 185, 129, 0.2)";
    } catch (err) {
      writeLog(err.message, true);
    }
  }

  // Action: Iniciar Sincronização Automática com Persistência
  syncBtn.addEventListener("click", async () => {
    writeLog("Iniciando varredura na aba ativa...");
    statusBadge.textContent = "Escanando...";
    writeLog("A extensão irá navegar e ler as páginas de atendimentos automaticamente...");
    
    if (typeof chrome === "undefined" || !chrome.tabs) {
      writeLog("Extensão não está rodando no Chrome.", true);
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        writeLog("Nenhuma aba ativa identificada.", true);
        return;
      }

      if (!tab.url || !tab.url.includes("seufisio.com.br")) {
        writeLog("Aba atual não pertence ao site SeuFisio (*.seufisio.com.br). Abra o relatório de atendimentos no SeuFisio antes de sincronizar.", true);
        return;
      }

      const month = parseInt(monthSelect.value);
      const year = parseInt(yearSelect.value);
      const serverUrl = serverUrlInput.value.trim();
      const syncToken = syncTokenInput.value.trim();

      // Salva o estado inicial na storage para persistência no reload
      const syncState = {
        active: true,
        month,
        year,
        atendimentos: [],
        pageCount: 1
      };

      await chrome.storage.local.set({ syncState, serverUrl, syncToken });
      writeLog("Estado de sincronização configurado.");

      writeLog("Injetando script de varredura na aba ativa...");
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"]
        });
        writeLog("Script de varredura injetado com sucesso.");
      } catch (scriptErr) {
        // Ignora se o script já estiver injetado
      }

      // Envia comando para iniciar a varredura
      chrome.tabs.sendMessage(tab.id, { action: "startSync" }, (response) => {
        if (chrome.runtime.lastError) {
          writeLog("Iniciando varredura em segundo plano (se a página já tiver o script)...");
        }
      });

    } catch (err) {
      writeLog(err.message, true);
    }
  });

  // Action: Fallback manual parse (from pasted text)
  parseRawBtn.addEventListener("click", () => {
    const rawText = rawTextInput.value.trim();
    if (!rawText) {
      writeLog("Por favor, insira o texto bruto copiado do SeuFisio no campo acima.", true);
      return;
    }

    writeLog("Iniciando parse manual do texto bruto...");
    const lines = rawText.split("\n");
    const atendimentos = [];

    // Regex to match "DD/MM/YYYY HH:mm:ss" or "DD/MM/YYYY HH:mm"
    const dateRegex = /(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}(:\d{2})?)/;
    
    // Status list matching Seufisio standard
    const statusList = ["Finalizado", "Não Compareceu", "Ausência Justificada", "Ausência do Profissional", "Ausência Nula"];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;

      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        const dateStr = dateMatch[1];
        const parts = line.split(dateStr);
        const beforeDate = parts[0].trim();
        const afterDate = parts.slice(1).join(dateStr).trim();

        if (!beforeDate) continue;
        
        let status = "Finalizado";
        let type = afterDate;
        let valor = 0;

        for (const s of statusList) {
          if (afterDate.includes(s)) {
            status = s;
            const afterStatusParts = afterDate.split(s);
            type = afterStatusParts[0].trim();
            const rest = afterStatusParts.slice(1).join(s);
            const valMatch = rest.match(/(\d+,\d{2})/);
            if (valMatch) valor = parseFloat(valMatch[1].replace(',', '.'));
            break;
          }
        }

        atendimentos.push({
          cliente: beforeDate,
          professional: beforeDate,
          data: dateStr,
          tipo: type,
          status,
          valor
        });
      }
    }

    writeLog(`Parse manual concluído: ${atendimentos.length} atendimentos encontrados.`);
    if (atendimentos.length > 0) {
      sendToKinesis(atendimentos);
    } else {
      writeLog("Nenhuma linha contendo datas no formato DD/MM/YYYY HH:mm foi reconhecida no texto colado.", true);
    }
  });
});
