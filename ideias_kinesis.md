# 📓 Bloco de Notas: Ideias e Soluções para o Kinesis App

Bem-vindo ao nosso espaço de brainstorming! Este documento serve como um **Bloco de Notas ativo** para planejar, estruturar e refinar ideias para o ecossistema do **Kinesis App** (que engloba o **KinesisLab** para a parte clínica e o **Módulo de Gestão** para a administrativa/financeira).

Abaixo, você encontrará uma análise do ecossistema atual baseada nos dados e código do projeto, seguida por propostas detalhadas de soluções técnicas para implementar cada ideia de forma otimizada.

---

## 🔍 Visão Geral do Ecossistema Atual

Com base no mapeamento do código do projeto (`kinesis-app`), temos três pilares principais:

1. **Módulo Clínico (KinesisLab):**
   * **Rotas:** `/dashboard`, `/assessment`, `/dashboard/patient`, etc.
   * **Objetivo:** Registro de avaliações, evolução diária (`Evolution`), prontuários e prescrição de rotinas de reabilitação.
   * **Banco de Dados:** Tabelas como `Assessment`, `AssessmentTemplate` e `Evolution`.

2. **Módulo de Gestão (Gestão Kinesis):**
   * **Rotas:** `/gestao`, `/financeiro`, `/producao` (comissão/sessões), `/cobrancas`, `/profissionais` e `/upload`.
   * **Objetivo:** Controle de repasses a profissionais, faturamento de sessões, importações de extratos/planilhas do Banco do Brasil e controle de despesas.
   * **Banco de Dados:** Tabelas como `Professional`, `Session`, `Transaction`, `ServicePercentage`, `ImportLog` e `BillingSession`.

3. **Portal do Paciente:**
   * **Rotas:** `/p/[token]`, `/p/[token]/diario`, `/p/[token]/exercicios` e `/p/[token]/lembretes`.
   * **Objetivo:** Espaço móvel para o paciente relatar dor (`DiaryLog`), ver sua rotina de exercícios físicos prescritos e configurar notificações push.
   * **Banco de Dados:** Acesso sem senha utilizando o `accessToken` único em `Patient`, gravando registros em `DiaryLog`.

---

## 💡 Ideias de Melhorias e Soluções Técnicas

Aqui estão as principais oportunidades identificadas para expandir nosso app, já desenhadas dentro da arquitetura existente.

---

### 1. 📈 Gráfico Evolutivo de Dor e Humor do Paciente
* **Objetivo:** Permitir que o fisioterapeuta analise visualmente no painel do profissional se o paciente está melhorando ao longo do tempo com base no diário de dor.
* **Solução Proposta:** Criar um gráfico de linha interativo no perfil do paciente dentro do `/dashboard` clínico.
* **Mapeamento Técnico:**
  * **Banco de Dados:** Consome a tabela `DiaryLog` (filtra por `patientId`, ordenando por `createdAt`).
  * **API (Backend):** Criar uma Server Action ou rota `/api/patients/[id]/pain-history` que retorne dados agrupados: `{ data: string, painLevel: number, mood: string }`.
  * **Interface (Frontend):** 
    * Arquivo a alterar/criar: Componente dentro de `src/app/(lab)/dashboard/patient/[id]/` (ou semelhante).
    * Usar biblioteca de gráficos (como `recharts` ou SVG puro animado) para desenhar a curva. Níveis de dor altos (7-10) em vermelho/laranja e baixos (0-2) em verde.
  * **Impacto:** ⭐⭐⭐⭐ | **Dificuldade:** 🟢 Fácil

---

### 2. 📝 Construtor de Templates de Avaliação Dinâmicos (Form Builder)
* **Objetivo:** Evitar criar novas tabelas ou páginas de código sempre que a clínica quiser criar uma nova ficha de avaliação (ex: Avaliação de Joelho, Ombro, etc.).
* **Solução Proposta:** Criar uma área administrativa onde o profissional monta a avaliação arrastando campos e o sistema renderiza dinamicamente.
* **Mapeamento Técnico:**
  * **Banco de Dados:** A tabela `AssessmentTemplate` já possui a coluna `structure Json`. Vamos salvar nessa coluna um array de campos como:
    ```json
    [
      { "id": "historico_dor", "type": "textarea", "label": "Histórico da Dor" },
      { "id": "grau_flexao", "type": "number", "label": "Flexão Máxima (graus)" },
      { "id": "teste_especifico", "type": "select", "label": "Teste de Gaveta", "options": ["Positivo", "Negativo"] }
    ]
    ```
  * **Interface (Frontend):** 
    * Criar tela `/dashboard/admin/templates` para configurar novos templates.
    * No momento de realizar a avaliação do paciente (`/dashboard/patient/[id]/evaluate`), ler o `structure` do template e usar um componente React dinâmico que gera os inputs em tela com base na estrutura JSON.
    * Salvar as respostas no campo `questionnaire_answers Json` de `Assessment`.
  * **Impacto:** ⭐⭐⭐⭐⭐ | **Dificuldade:** 🟡 Média

---

### 3. 🪙 Cálculo Automatizado de Repasses e Comissões
* **Objetivo:** O módulo de gestão precisa calcular de forma exata e rápida o valor que cada fisioterapeuta deve receber no fim do mês.
* **Solução Proposta:** Uma tela que consolida o faturamento e comissão individualizada de cada profissional.
* **Mapeamento Técnico:**
  * **Banco de Dados:** Utiliza as tabelas `Session`, `Professional` e `ServicePercentage`.
  * **Lógica de Cálculo:**
    * Para cada sessão do profissional no período:
      1. Verificar se existe regra customizada em `ServicePercentage` para aquele `serviceCode` (ex: "RPG", "PILATES") e data específica.
      2. Caso contrário, aplicar o `Professional.defaultPercentage` (ex: 50%).
      3. Calcular: `Valor Profissional = Session.value * porcentagem`.
  * **Interface (Frontend):**
    * Criar/Expandir a tela em `src/app/(gestao)/producao/page.tsx` (ou criar uma subpasta `/comissoes`).
    * Filtros por profissional, mês/ano.
    * Tabela detalhando: Data da Sessão | Paciente | Tipo | Valor Pago | Comissão (%) | Receber (R$).
    * Botão de "Marcar como Pago" (gerando transação de saída em `Transaction`).
  * **Impacto:** ⭐⭐⭐⭐⭐ | **Dificuldade:** 🟡 Média

---

### 4. 📂 Conciliação Bancária Automatizada (BB)
* **Objetivo:** Agilizar o processo de marcar as faturas (`BillingSession`) de pacientes como pagas. Atualmente, o usuário importa os arquivos, mas a conciliação pode ser manual ou semi-automatizada.
* **Solução Proposta:** Processamento do extrato bancário PDF/Excel do Banco do Brasil com correspondência inteligente.
* **Mapeamento Técnico:**
  * **Banco de Dados:** Tabela `BillingSession` e `Transaction`.
  * **Lógica de Importação:**
    * O script em `C:\Users\daniel\.gemini\antigravity\scratch\kinesis-app\scripts` ou uma rota de API lerá o extrato (temos o arquivo `extrato abril 26 bb.pdf` no ecossistema!).
    * Identificar transferências/Pix recebidos.
    * Comparar o valor e o nome (ou parte do nome) do depositante com os registros de `BillingSession` que tenham `isPaid: false`.
    * Apresentar uma tela de "Matches recomendados" para o usuário confirmar com 1 clique antes de atualizar o banco de dados.
  * **Impacto:** ⭐⭐⭐⭐ | **Dificuldade:** 🔴 Alta (devido à extração de texto do PDF do extrato e mapeamento de nomes/Pix).

---

### 5. 💬 Disparador de Mensagens e Alertas via WhatsApp
* **Objetivo:** Lembrar os pacientes de preencherem o Diário de Dor (`DiaryLog`) e praticarem os exercícios domiciliares em vídeo.
* **Solução Proposta:** Integração direta com uma API de envio de WhatsApp (ex: Evolution API ou Z-API) acionada pelo profissional.
* **Mapeamento Técnico:**
  * **Banco de Dados:** Utiliza o campo `Patient.phone` e `Patient.accessToken`.
  * **Fluxo de Integração:**
    * Criar um botão "Solicitar Diário de Dor" no prontuário do paciente (`/dashboard/patient/[id]`).
    * Ao clicar, o backend monta uma mensagem personalizada:
      > *"Olá, {Nome}! Como está sua dor hoje? Por favor, reserve 1 minuto para registrar como você está se sentindo aqui: https://kinesis.app/p/{accessToken}/diario"*
    * O backend faz uma requisição POST HTTP externa para a API do WhatsApp configurada.
  * **Impacto:** ⭐⭐⭐⭐⭐ | **Dificuldade:** 🟡 Média (requer contratação/configuração de gateway de mensagens).

---

### 6. 🧠 Identificação de Padrões de Presença e Absenteísmo (Inteligência Clínica & Gestão)
* **Objetivo:** Detectar padrões de comportamento nos pacientes com base em suas presenças e ausências para prever abandono de tratamento (churn), otimizar horários e correlacionar a assiduidade com a evolução da dor.
* **Soluções Propostas:**
  1. **Análise Temporal de Faltas (Agenda):** Identificar se o paciente tende a faltar em dias ou horários específicos (ex: 80% das faltas do Paciente X ocorrem às segundas de manhã). O sistema sugere readequação de horário.
  2. **Alerta de Risco de Churn (Evasão):** Disparar alerta na recepção se um paciente acumular 3 faltas consecutivas ou se a taxa de assiduidade geral cair abaixo de 70% nos últimos 30 dias.
  3. **Cruzamento Clínico (Dor vs. Assiduidade):** Cruzar a presença física (`Session.status = "Finalizado"`) com os dados do diário de dor (`DiaryLog.painLevel`). O sistema gera um gráfico provando o impacto clínico: *"Nas semanas em que você compareceu a todas as sessões, sua dor média foi 3/10; nas semanas com faltas, subiu para 7/10"*.
  4. **Correlação de Perfil (Geográfico/Demográfico):** Usar os dados demográficos de `Patient` (como idade, profissão e distância - latitude/longitude) para mapear se pacientes que moram em certas regiões ou têm certas profissões possuem maior índice de faltas.
* **Mapeamento Técnico:**
  * **Banco de Dados:**
    * Consome `Session` (filtrando por `patientName` ou vinculando ao paciente, analisando o campo `status` que armazena `"Finalizado"`, `"Não Compareceu"` e `"Ausência Justificada"`).
    * Consome `DiaryLog` (agrupando `painLevel` por semana/mês).
    * Consome `Patient` (para dados geográficos e de perfil).
  * **API (Backend):** Rota `/api/analytics/patients/[id]/patterns` para obter a taxa de absenteísmo agrupada por dia da semana, faixa de horário e correlação com a dor.
  * **Interface (Frontend):**
    * Aba **"Insights"** no prontuário do paciente em `/dashboard/patient/[id]`.
    * Widget na home da recepção com a lista de **"Pacientes em Risco de Desistência"** para contato proativo.
  * **Impacto:** ⭐⭐⭐⭐⭐ | **Dificuldade:** 🟡 Média (lógica puramente matemática/estatística no backend).

---

### 7. 🔄 Sistema de Reengajamento Automatizado para Pacientes Inativos
* **Objetivo:** Recuperar pacientes que pararam de comparecer (última sessão há mais de 14 dias) e não possuem nenhuma consulta futura agendada, automatizando a abordagem e colhendo o feedback sobre o motivo de estarem afastados.
* **Solução Proposta & Implementação:**
  1. **Motor de Busca de Inativos (Backend):** Lógica que varre a tabela `Patient`, busca a última data de `Session` de cada um e verifica se não há novos agendamentos agendados a partir do dia atual.
  2. **Abordagem via WhatsApp (Simulação/API):** O sistema monta e envia um texto amigável com um link único de acesso do paciente (`/p/[token]/motivo`). O disparo é registrado em `Patient.change_logs` (tipo `"REENGAGEMENT_CONTACT"`).
  3. **Portal do Paciente (Coleta de Feedback):** Uma tela premium onde o paciente seleciona o motivo da ausência (Melhorou, Financeiro, Horários, Dor Pós-Sessão, Outros) e deixa um comentário. A resposta atualiza o log do paciente (tipo `"REENGAGEMENT_FEEDBACK"`).
* **Mapeamento Técnico Proposto:**
  * **Serviço do Servidor (Novo arquivo):** `src/gestao/services/reengagementService.ts` (para centralizar busca de inativos, disparo simulado de WhatsApp e manipulação de feedbacks).
  * **Server Action do Portal (Ajustar em):** [actions.ts](file:///C:/Users/daniel/.gemini/antigravity/scratch/kinesis-app/src/app/(portal)/actions.ts) (adicionar `saveReengagementFeedbackAction` para conectar o formulário do portal ao banco).
  * **Página do Portal (Nova rota):** `src/app/(portal)/p/[token]/motivo/page.tsx` (criar tela móvel responsiva premium para coletar o feedback do paciente).
* **Impacto:** ⭐⭐⭐⭐⭐ | **Dificuldade:** 🟡 Média (pela estruturação inicial dos fluxos).

---

### 8. 📊 Módulo de Inteligência de Negócios (Business Intelligence, Projeções e Estratégia)
* **Objetivo:** Transformar os lançamentos financeiros (`Transaction`) e atendimentos (`Session`) do mês em análises críticas e comparativas de performance, gerar projeções de fluxo de caixa e faturamento futuros, e sugerir estratégias de otimização de serviços e profissionais.
* **Componentes da Solução Proposta:**
  1. **Análise Comparativa Automática:** 
     * Cruzamento instantâneo do mês selecionado com o mês anterior (M-1) e com o mesmo mês do ano anterior (Y-1).
     * Mapeamento de variação (%) em Faturamento Bruto, Lucro Líquido, Custo com Repasses e Volume de Sessões.
  2. **Análise de Desempenho e Eficiência (Fisioterapeutas & Serviços):**
     * **Métricas por Profissional:** Retorno financeiro trazido vs. Custo de comissão, Taxa de fidelização de pacientes (quantos retornam no mês seguinte) e Índice de Faltas/Desistências.
     * **Métricas por Serviço:** Margem de contribuição (qual serviço dá mais lucro para a clínica por hora/sessão). Identificação de serviços ociosos (muitos horários livres) vs. saturados.
  3. **Projeções de Tendências Futuras (Forecasting):**
     * **Previsão de Fluxo de Caixa:** Aplicação de médias móveis ponderadas e regressão linear simples com base nos últimos 6 a 12 meses para desenhar o cenário de faturamento esperado para os próximos 3 meses.
     * **Ajuste de Sazonalidade:** Algoritmo que detecta meses historicamente fracos (ex: Dezembro/Janeiro) ou fortes (ex: Março/Novembro) com base nos anos anteriores (2019-2025 já no banco) e corrige as projeções futuras.
  4. **Simulador de Metas Interativo:**
     * Sliders interativos em que o gestor insere uma meta (ex: *"Aumentar lucro em 15%"*). O sistema calcula dinamicamente:
       * Quantas novas avaliações/pacientes a clínica precisa captar.
       * Como redistribuir esses pacientes entre os profissionais com horários ociosos.
  5. **Painel de Insights e Estratégia (IA / Regras de Negócio):**
     * Geração automática de alertas de ação. Ex: *"O Pilates representou 55% da receita líquida deste mês com ociosidade de apenas 5%. RPG está com ociosidade de 40%. Estratégia sugerida: migrar 2 horários do profissional Y para Pilates."*
* **Mapeamento Técnico Proposto:**
  * **Banco de Dados:** Consulta as tabelas `Session` (atendimentos e repasses), `Transaction` (custos operacionais e despesas) e `Professional`.
  * **Serviço Analítico (Novo arquivo):** `src/gestao/services/biAnalyticsService.ts` (lógica de comparação percentual, regressão estatística de projeção e cálculos de ociosidade).
  * **Rota de API (Nova rota):** `/api/gestao/analytics/bi` para fornecer os dados consolidados do mês de referência.
  * **Interface de Usuário (Nova página):** `src/app/(gestao)/gestao/inteligencia/page.tsx` (dashboard premium contendo gráficos comparativos de faturamento/lucro, tabela de eficiência de profissionais, simulador visual de metas e lista de recomendações estratégicas).
* **Impacto:** ⭐⭐⭐⭐⭐ | **Dificuldade:** 🟡 Média (lógica estatística no backend e visualização rica com gráficos no frontend).

---

## 📅 Integração Eficiente com Sistema de Agenda Fechado

Quando o sistema de agenda da clínica é fechado (sem API de integração direta), a alimentação do Kinesis App precisa de estratégias inteligentes para evitar digitação manual e retrabalho. 

Abaixo estão **4 caminhos eficientes** para resolver essa dor no nosso ecossistema Next.js/Prisma:

### Opção A: Upload Inteligente de Relatórios (Excel/PDF) com Mapeamento Fixo (Mais Prático)
* **Como funciona:** O usuário extrai o relatório padrão do sistema de agenda (geralmente em formato Excel/CSV ou PDF) e faz o upload na tela `/upload`. O Kinesis App identifica as colunas automaticamente e atualiza a agenda no banco de dados.
* **Mapeamento Técnico:**
  * O endpoint `/api/upload` já está preparado para ler Excel e PDF (`pdf-parse`).
  * Podemos adicionar um novo tipo de arquivo no seletor de uploads: `AGENDA_FECHADA`.
  * No código de processamento (`/api/upload/route.ts`), mapeamos as colunas exatas que o relatório da sua agenda exporta (ex: se a agenda exporta as colunas `"Horário"`, `"Nome do Cliente"`, `"Profissional"`, `"Serviço"`), adicionando essas chaves nas funções de busca automática.
* **Vantagem:** Desenvolvimento rápido (aproveita 90% do código de upload existente).
* **Impacto:** ⭐⭐⭐⭐ | **Dificuldade:** 🟢 Fácil

---

### Opção B: Extensão do Chrome para Sincronização em 1 Clique (Melhor UX)
* **Como funciona:** Se o sistema de agenda de vocês é acessado via web (no navegador Chrome), podemos criar uma Extensão do Chrome simples. O usuário abre a página da agenda no navegador e clica no botão da extensão: *"Sincronizar com o Kinesis"*.
* **Mapeamento Técnico:**
  * A extensão do Chrome usa um script (Content Script) para ler a tabela de agendamentos diretamente do HTML da página da agenda.
  * O script compila os dados (Nome do Paciente, Horário, Serviço, Profissional) e faz um POST direto para um endpoint no Kinesis App (ex: `/api/agenda/sync`) autenticado com uma API Key.
* **Vantagem:** Elimina a necessidade de gerar arquivos, exportar relatórios ou fazer uploads. A sincronização é instantânea com 1 clique.
* **Impacto:** ⭐⭐⭐⭐⭐ | **Dificuldade:** 🟡 Média

---

### Opção C: Integração Automática por E-mail (Email-to-App)
* **Como funciona:** Muitos sistemas legados de agenda permitem programar o envio diário/semanal de relatórios consolidados por e-mail (ex: enviar planilha de atendimentos todo dia às 21h).
* **Mapeamento Técnico:**
  * Configuramos uma caixa de entrada dedicada no Kinesis (ex: `agenda@kinesis.app`) usando um serviço de e-mail integrado (ex: SendGrid Inbound Parse ou um script cron que lê via IMAP usando a biblioteca `node-imap`).
  * Sempre que o e-mail automático com o relatório da agenda chegar, o servidor do Kinesis App extrai o anexo, processa os dados e preenche as tabelas de sessões sem nenhuma ação humana.
* **Vantagem:** Processo 100% automático (zero cliques).
* **Impacto:** ⭐⭐⭐⭐⭐ | **Dificuldade:** 🟡 Média

---

### Opção D: Script RPA Local (Automação de Desktop)
* **Como funciona:** Um pequeno script Python (`pyautogui` ou `selenium`) instalado no computador da recepção executa um agendamento diário: abre o sistema de agenda local à noite, faz login, exporta o relatório de atendimentos e faz um POST para a API do Kinesis App.
* **Vantagem:** Útil se o sistema de agenda for um software desktop offline instalado no Windows.
* **Impacto:** ⭐⭐⭐ | **Dificuldade:** 🔴 Alta (manutenção do script na máquina física).

---

## 📣 Estratégia de Marketing e Captação: Segmentação de Públicos Kinesis

Compreendemos que o público-alvo da clínica se divide em dois grandes perfis: **Médicos Encaminhadores** e **Pacientes**. Para maximizar a captação sem depender de fluxo passivo (mercado espontâneo), desenhamos estratégias de atração e fidelização voltadas para as particularidades de cada subsegmento.

---

## 👥 Perfil 1: O Médico Encaminhador

Este público tem a autoridade científica para prescrever a reabilitação. Dividimos este grupo em dois perfis de relacionamento:

### A. Encaminhadores Fiéis (Como Fidelizar com um Canal Claro)
Estes médicos já conhecem e confiam no seu trabalho. O desafio é formalizar e estreitar a parceria de forma transparente e ética, oferecendo **Exclusividade e Conveniência**.

* **1. O Canal Direto (Fast-Track/Linha Vermelha):**
  * **Abordagem de Conversa:**
    > *"Dr. Roberto, agradecemos muito a confiança que o senhor deposita na Kinesis ao nos enviar seus pacientes. Para garantir que eles tenham a melhor experiência possível, criamos um canal de atendimento prioritário para seus encaminhados. Qualquer paciente enviado pelo senhor terá prioridade de agendamento em até 24h, sob minha coordenação direta. Aqui está o contato do nosso Concierge exclusivo para médicos."*
  * **Integração no App:** Disponibilizar um link direto privado (ex: `kinesis.app/parceiro/dr-roberto`). Se o médico cadastrar um paciente ali, a recepção da Kinesis recebe um alerta de "Indicação VIP" no dashboard e liga para o paciente em 10 minutos. O médico sente que tem um serviço premium diferenciado à disposição de seus pacientes.
* **2. O Feedback Clínico Periódico (Demonstração de Valor):**
  * Enviar mensalmente uma mensagem curta com o resumo da evolução do paciente indicado. Ex: *"Dr. Roberto, a paciente Maria, que o senhor nos indicou, completou 8 sessões. A dor lombar reduziu de 7 para 2 de intensidade e restabelecemos a mobilidade. Obrigado por nos confiar o caso!"*.
  * O médico sente que a parceria é ativa e que o paciente está realmente melhorando.

### B. Encaminhadores Potenciais (Como Alcançar e Conectar)
Grande banco de contatos de médicos de outras áreas (geriatras, cardiologistas, neurologistas, etc.) que ainda não indicam de forma consistente.

* **1. Visitas e Apresentação de "Soluções por Sintoma":**
  * Em vez de vender "fisioterapia genérica", apresentar soluções para as dores recorrentes do consultório deles.
    * **Para Geriatras:** Abordar com foco em Baropodometria, equilíbrio e prevenção de quedas em idosos.
    * **Para Cardiologistas:** Reabilitação cardiopulmonar funcional e Pilates clínico monitorado.
    * **Para Endocrinologistas:** Fortalecimento e proteção articular para pacientes em tratamento de obesidade.
* **2. O "Voucher de Check-up Funcional" como Cortesia:**
  * Fornecer cartões/vouchers físicos ou digitais de *"Avaliação de Risco de Queda"* ou *"Avaliação Cinemática/Postural"* gratuita para o médico presentear seus pacientes durante a consulta. Isso agrega valor à consulta do próprio médico (ele oferece um presente exclusivo) e atrai o paciente para conhecer a Kinesis.

---

## 👥 Perfil 2: O Paciente

Os clientes finais que realizam o tratamento. Dividem-se em dois canais de entrada:

### A. Pacientes Encaminhados (Como Reter e Gerar Encantamento)
Chegam através da recomendação médica, portando alto nível de confiança prévia. O foco é a **Experiência Premium (Efeito UAU)**.

* **1. Ritual de Acolhimento Personalizado:**
  * Na recepção, fazer a conexão com o médico indicador: *"Seja bem-vindo, Sr. João! O Dr. Roberto nos enviou seu caso e pediu atenção máxima. Já preparamos o seu chá preferido e a sala está climatizada exatamente como o senhor gosta."* (Módulo de Hospitalidade 5 Estrelas).
* **2. Relatório de Triagem Físico-Digital:**
  * Ao concluir a avaliação física inicial, enviar um relatório com gráficos e metas direto no WhatsApp/Portal do paciente. Ele percebe a sofisticação tecnológica do serviço e compartilha orgulhoso com familiares.

### B. Pacientes Espontâneos (Como Atrair de Forma Ativa)
Pessoas que buscam por alívio de dor de forma autônoma na internet ou por indicação boca-a-boca.

* **1. SEO Local e Posicionamento de Sintomas no Google:**
  * Pacientes espontâneos buscam no Google por termos como: *"dor na coluna ao levantar"*, *"clínica de pilates perto de mim"*, *"fisioterapia para tendinite [Bairro]"*.
  * Manter o perfil do Google Meu Negócio da clínica impecável (5 estrelas), com avaliações detalhadas de outros pacientes.
* **2. Notificação Automática de Avaliações (Referral Loop):**
  * **Integração no App:** No momento da alta clínica do paciente, o Kinesis App envia uma notificação automática agradecendo a jornada e fornecendo o link direto do Google para avaliação: *"Ficamos muito felizes com a sua recuperação! Que tal ajudar outras pessoas a vencerem a dor avaliando nosso serviço?"*.
* **3. Programa "Indique um Familiar" Elegante:**
  * Oferecer aos pacientes ativos a possibilidade de presentear um familiar ou amigo com uma sessão de "Check-up Funcional/Postural" de cortesia na Kinesis.

---

## 🗃️ Estrutura Técnica de Apoio: Módulo CRM Médico no Kinesis App

Para que o administrador consiga gerenciar essa base de dados de médicos e mensurar quais parcerias estão funcionando:

* **Cadastro de Médicos (`Doctor`):** Tabela no Prisma vinculando o médico ao seu CRM, especialidade, telefone e clínica.
* **Vínculo na Ficha do Paciente:** Campo de seleção para associar o paciente ao médico que o indicou.
* **Métricas de Conversão (BI):** Relatório analítico mostrando a receita bruta e quantidade de pacientes captados por médico indicador no mês, permitindo saber quais parceiros devem receber visitas ou mimos de agradecimento (ex: no Dia do Médico).

---

## 🏨 Hospitalidade 5 Estrelas: A Experiência Kinesis Concierge

Pacientes de alto padrão que frequentam hotéis 5 estrelas valorizam três pilares: **Hiper-personalização** (o hotel sabe quem eles são e o que preferem), **Antecipação** (ter as necessidades atendidas antes de pedir) e **Fricção Zero** (não há filas, burocracia ou transações financeiras visíveis).

Podemos desenhar a experiência digital e física do Kinesis App para refletir exatamente esse nível de luxo:

---

### Ação 1: O Módulo de "Preferências de Hospitalidade" (Prontuário do Hóspede)
* **Como funciona:** Hotéis de luxo mantêm uma "ficha de hóspede" com suas preferências. Faremos o mesmo no prontuário clínico.
* **Integração no App:** 
  * Criar uma seção de Hospitalidade no cadastro do `Patient` com os seguintes campos:
    * **Bebida favorita:** Ex: café expresso curto sem açúcar, água com gás e limão, chá de camomila morno.
    * **Climatização preferida:** Ex: 21°C.
    * **Trilha sonora favorita para a sala:** Ex: Jazz suave, Bossa Nova, música clássica ou silêncio absoluto.
    * **Aroma preferido:** Ex: Lavanda, Alecrim, Capim-limão.
  * **Uso prático:** 15 minutos antes do horário agendado, o Kinesis App envia uma notificação na tela do fisioterapeuta e da recepção: *"Dr. Alexandre chega em 15 min. Preparar: Ar em 20°C, Playlist Jazz, Café Expresso Curto pronto na mesa."*. O paciente entra na sala e tudo está impecável, sem que ele precise pedir nada.

### Ação 2: Concierge Digital e Atendimento Direto
* **Como funciona:** O paciente não quer falar com o "Suporte" ou com o "Fale Conosco". Ele quer falar com seu concierge.
* **Integração no App:**
  * No portal do paciente `/p/[token]`, a área de contato é rebatizada para: **"Falar com meu Concierge Kinesis"** ou **"Falar com meu Terapeuta Particular"**.
  * A estética do portal adota um estilo visual limpo e sofisticado (design premium com fontes elegantes como *Outfit* ou *Playfair*, transições fluidas e ausência de qualquer poluição visual).

### Ação 3: Check-in e Faturamento com Fricção Zero
* **Como funciona:** Em um ambiente 5 estrelas, o paciente não fica em filas na recepção para passar o cartão, assinar guias ou preencher fichas físicas.
* **Integração no App:**
  * **Check-in Invisível:** Utilizando a geolocalização do portal do paciente (`accessToken`), o aplicativo detecta quando o paciente chega na clínica e notifica o terapeuta automaticamente no tablet/computador: *"Dr. Alexandre acabou de entrar na recepção"*.
  * **Checkout e Pagamento Invisíveis:** Integração de pagamento digital recorrente ou faturamento em lote pós-tratamento. A cobrança é feita diretamente no cartão de crédito cadastrado na conta do paciente (via API de pagamentos integrada), e o recibo/nota fiscal é enviado diretamente para o e-mail ou WhatsApp dele, de forma discreta.

### Ação 4: Kits de Reabilitação e Acessórios com Embalagem Premium
* **Como funciona:** Se o paciente precisa de um acessório para exercitar-se em casa (como faixas elásticas, óleos ou palmilhas), a entrega não deve ser feita em sacolas plásticas comuns.
* **Integração no App:**
  * O app gerencia o inventário de "Kits de Casa". Cada kit é entregue em uma caixa rígida premium texturizada com a marca Kinesis.
  * Dentro da caixa, o paciente encontra um cartão personalizado escrito à mão pelo fisioterapeuta e um **QR Code único** que o leva direto para os vídeos específicos daqueles exercícios no portal móvel dele (`/p/[token]/exercicios`).

---

### 9. 🔔 Fluxo de Notificação e Preenchimento Clínico Pós-Avaliação
* **Objetivo:** Garantir que o prontuário de reabilitação do paciente esteja sempre completo. Quando um profissional realiza uma avaliação, o sistema identifica quem a fez e envia um lembrete/link para que ele preencha a ficha clínica complementar do paciente.
* **Componentes da Solução Proposta:**
  1. **Gatilho de Criação (Trigger):** O sistema monitora a criação de novos registros na tabela `Assessment`.
  2. **Identificação do Profissional:** O sistema lê o campo `created_by_id` do registro criado e busca o e-mail/telefone do usuário (`User`) associado.
  3. **Disparo da Mensagem:** Envia um alerta automático (seja via notificação interna no painel administrativo, e-mail ou integração de WhatsApp) para o profissional.
     * *Mensagem Exemplo:* *"Olá, {Nome do Profissional}! Vimos que você concluiu a avaliação de {Nome do Paciente}. Por favor, clique aqui para preencher a Ficha de Informações Clínicas do paciente (Dominância, Nível de Atividade Física e Observações de Alta Relevância): [Link]"*
  4. **Ficha Clínica Complementar (Formulário):** Um formulário direcionado que atualiza diretamente os campos clínicos do modelo `Patient` (como `dominance`, `activity_level`, `prescribed_exercises`, etc.).
* **Mapeamento Técnico Proposto:**
  * **Banco de Dados:** Envolve a tabela `Assessment` (gatilho), `User` (remetente/contato) e `Patient` (onde as informações clínicas da ficha complementar serão salvas).
  * **Lógica no Backend:** Implementação de um interceptor/middleware no Prisma ou uma função de callback na Server Action que cria a avaliação (`src/app/(lab)/dashboard/assessment/actions.ts` ou similar).
  * **Interface do Usuário:** Criação de uma rota rápida `/dashboard/patient/[id]/ficha-clinica` contendo o formulário focado para preenchimento ágil pelo profissional.
* **Impacto:** ⭐⭐⭐⭐ | **Dificuldade:** 🟢 Fácil (aproveita a autenticação e as tabelas existentes do Prisma).

---

### 10. 💬 Assistente de Inteligência Artificial (Kinesis AI Copilot)
* **Objetivo:** Permitir que gestores, secretárias e fisioterapeutas façam perguntas em linguagem natural sobre qualquer dado da clínica (faturamento, sessões, profissionais, faltas, prontuários) e obtenham respostas e insights estruturados instantaneamente.
* **Componentes da Solução Proposta:**
  1. **Campo de Texto de Consulta Rápida (Chatbot/Search Bar):** Uma barra de pesquisa flutuante ou fixada no cabeçalho do dashboard administrativo (ex: *"Pergunte qualquer coisa sobre a clínica..."*).
  2. **Tradução de Linguagem Natural para Dados (Text-to-Query / RAG):**
     * O usuário digita uma pergunta. Exemplos:
       * *"Qual foi o faturamento líquido de Pilates no último mês?"*
       * *"Quem é o paciente que mais faltou nas últimas 3 semanas?"*
       * *"Quais fisioterapeutas têm mais horários livres nas terças-feiras?"*
     * O backend envia o texto da pergunta em conjunto com uma descrição do esquema do banco de dados (schema do Prisma) para uma API de LLM (como Google Gemini API ou OpenAI API).
     * A IA traduz a pergunta em uma consulta SQL/Prisma segura e executa no banco de dados da clínica, ou processa os dados anonimizados para formular a resposta.
  3. **Visualização Dinâmica de Respostas:**
     * A resposta é retornada em Markdown estruturado para leitura rápida.
     * **Gráficos por Demanda:** Se a pergunta envolver dados temporais (ex: *"Mostre o faturamento dos últimos 6 meses"*), a IA retorna o JSON estruturado e o frontend renderiza automaticamente um gráfico de barras ou linhas correspondente, sem precisar criar telas específicas para cada relatório.
  4. **Segurança de Dados e LGPD:**
     * Mascaramento de dados sensíveis de saúde antes do envio de prompts para modelos de linguagem.
     * Controle de acesso: Um usuário com perfil `SECRETARIA` não pode obter dados salariais/comissões de profissionais que somente o `ADMIN` tem direito de ver.
* **Mapeamento Técnico Proposto:**
  * **Banco de Dados:** Acesso de leitura a todas as tabelas (conforme nível de permissão do usuário logado).
  * **Serviço de IA (Novo arquivo):** `src/gestao/services/aiCopilotService.ts` (lógica de formatação de prompt, tradução de query, validação de segurança e chamada à API do Gemini/OpenAI).
  * **Rota de API (Nova rota):** `/api/gestao/ai/copilot` (POST que recebe a pergunta, valida a autorização da sessão do usuário e retorna a resposta contextualizada).
  * **Componente de UI (Novo componente):** `src/gestao/components/AICopilotChat.tsx` (painel flutuante de chat com suporte a renderização de Markdown e gráficos dinâmicos com Recharts).
* **Impacto:** ⭐⭐⭐⭐⭐ | **Dificuldade:** 🔴 Alta (pela necessidade de validação e prevenção de SQL Injection gerado por IA).

---

## 🤝 Rotina de Alinhamento: Gestão de Reuniões & Cultura de Dados

Para que as análises geradas pelo Kinesis App reflitam em melhorias práticas, a clínica deve adotar uma rotina consistente de reuniões baseadas em dados. Abaixo está a proposta de estruturação para as reuniões de **Equipe Completa** e **Administrativas/Gestão**:

---

### 1. Reuniões de Equipe Completa (Fisioterapeutas, Recepção e Gestão)
* **Objetivo:** Engajar a equipe nos objetivos da clínica, apresentar resultados qualitativos e quantitativos gerais, estudar casos clínicos de sucesso e planejar a experiência 5 estrelas.
* **Frequência:** **Mensal** (idealmente na primeira semana do mês, ex: até o 5º dia útil).
* **Duração:** 1h a 1h30.
* **Pauta Sugerida (Temas a Abordar):**
  1. **Apresentação de Indicadores Gerais (Métricas do KinesisLab):**
     * Total de atendimentos realizados no mês anterior.
     * Taxa de assiduidade geral da clínica e percentual de faltas (`Session.status`).
     * Evolução média da dor dos pacientes ativos (`DiaryLog`), provando o valor do tratamento.
  2. **Destaques e Reconhecimento:**
     * Elogios de pacientes e pontuação média de feedback.
     * Apresentação rápida (10 min) de um **Estudo de Caso de Sucesso** por um dos fisioterapeutas (como um paciente complexo evoluiu e obteve alta).
  3. **Identificação e Resolução de Gargalos:**
     * Discussão sobre pacientes em Risco de Desistência (Churn) e o que a equipe pode fazer (ajustar horários, mudar abordagem clínica).
     * Pontos de atrito entre recepção e terapeutas (ex: atrasos, passagens de caso).
  4. **Momento Hospitalidade 5 Estrelas (15 min):**
     * Revisão dos rituais de conforto (bebidas favoritas dos pacientes da semana, playlists, alinhamento de temperatura da recepção/sala).

---

### 2. Reuniões Administrativas / Gestão (Sócios, Administrador e Gerente)
* **Objetivo:** Analisar a saúde financeira profunda da clínica, avaliar custos, repasses de comissão, eficácia de campanhas de captação e traçar decisões estratégicas e metas comerciais.
* **Frequência:** **Quinzenal** (para acompanhamento ágil de caixa) ou **Mensal**.
* **Duração:** 1h30 a 2h.
* **Pauta Sugerida (Temas a Abordar):**
  1. **Fechamento e Saúde Financeira (Métricas de Gestão):**
     * Faturamento Bruto vs. Despesas Operacionais Fixas/Variáveis (`Transaction`).
     * Lucro Líquido Real e margem da clínica.
     * Status de faturamentos abertos (`BillingSession` pendente de acerto vs. extrato bancário).
  2. **Performance e Margem de Serviços:**
     * Faturamento por modalidade (Pilates vs. Fisioterapia/Reabilitação vs. RPG).
     * Ociosidade de horários: mapear em qual serviço a clínica está perdendo dinheiro por ter salas vazias.
  3. **Eficiência e Custo de Profissionais:**
     * Custo total de repasses por profissional vs. faturamento bruto gerado.
     * Taxa de ocupação média de agenda de cada terapeuta e taxa de captação/fidelização de pacientes novos por profissional.
  4. **Estratégia de Marketing e Parcerias Médicas (CRM):**
     * Avaliação das indicações de médicos parceiros do CRM.
     * Definição de quais especialidades (ex: geriatras, cardiologistas) receberão as próximas visitas de relacionamento e relatórios de evolução clínica (`Cavalo de Troia`).
  5. **Simulação e Planejamento de Metas (Simulador do App):**
     * Uso do simulador de metas do Kinesis para os próximos 3 meses (projeção de faturamento/caixa futuro) e definição de investimento necessário em captação ou capilaridade de horários.

---

### 11. 📊 Análise de Frequência e Aderência de Pacientes por Profissional
* **Objetivo:** Medir se os pacientes estão cumprindo a recomendação terapêutica prescrita (dosagem de tratamento) por profissional. Mapear a distribuição de comparecimentos (frequência) por semana e mês na carteira ativa de cada fisioterapeuta, exibindo os dados em gráficos.
* **Componentes da Solução Proposta:**
  1. **Análise de Frequência Semanal:**
     * Agrupa as sessões com status `"Finalizado"` do profissional por paciente e por semana (`Year-Week`).
     * Classifica os pacientes em faixas:
       * **1 vez na semana:** Frequência de manutenção ou baixa aderência.
       * **2 vezes na semana:** Frequência padrão/intermediária de reabilitação.
       * **3+ vezes na semana:** Frequência intensiva.
     * Mostra a proporção percentual da carteira (ex: *"30% dos pacientes compareceram 2x na semana"*).
  2. **Análise de Frequência Mensal:**
     * Agrupa as sessões finalizadas por paciente e por mês útil.
     * Classifica em faixas personalizadas (ex: compareceu menos de 4 vezes no mês, exatamente 4 vezes, 8 vezes, ou mais de 8 vezes).
     * Permite identificar a consistência do tratamento a longo prazo (ex: *"40% dos pacientes compareceram 4 vezes ao mês"*).
  3. **Visualização Gráfica Intuitiva:**
     * Exibição de gráficos de rosca (Donut Chart) ou colunas empilhadas para cada profissional, mostrando a distribuição de frequência semanal e mensal de seus pacientes.
     * Destaque para taxas de sub-dosagem (pacientes que faltam e caem de faixa) ajudando o profissional a conversar de forma embasada com o paciente.
* **Mapeamento Técnico Proposto:**
  * **Banco de Dados:** Consulta a tabela `Session` filtrando por `professionalId` e `status = "Finalizado"`.
  * **Serviço Analítico (Novo arquivo):** `src/gestao/services/professionalAnalyticsService.ts` (lógica de agrupamento por datas/semanas e cálculo de porcentagem de aderência).
  * **Interface do Usuário (Nova aba):** Aba de "Aderência e Frequência" na página de detalhes do profissional (`src/app/(gestao)/profissionais/[id]/page.tsx` ou dashboard específico) exibindo os gráficos.
* **Impacto:** ⭐⭐⭐⭐ | **Dificuldade:** 🟢 Fácil (aproveita as consultas de sessões por profissional existentes).

---

## 🪙 Modelos de Negócio Éticos: Previsibilidade vs. Honestidade Financeira

Cobrar do paciente ao final do mês apenas pelas sessões efetivamente consumidas é o ápice da honestidade e justiça na relação clínica. No entanto, esse modelo transfere **todo o risco financeiro para a clínica**, gerando oscilações de faturamento e facilitando o abandono de tratamentos pela falta de um compromisso financeiro inicial (gatilho mental do custo afundado).

Abaixo, propomos **4 soluções de meio-termo** que trazem previsibilidade financeira e aumentam o engajamento do paciente, sem ferir a ética e a honestidade da Kinesis:

---

### Opção 1: Assinatura Recorrente Mensal por "Vaga Garantida" (Membership)
* **Como funciona:** Em vez de vender pacotes de sessões acumuladas, você vende a **manutenção de uma vaga fixa e exclusiva na agenda** (ex: Pilates ou Reabilitação 2x por semana). O pagamento é feito no início do mês de forma recorrente (cartão de crédito).
* **Alinhamento Ético (Justiça para o Paciente):**
  * O paciente paga um valor fixo mensal pela garantia de que a sala e o terapeuta estarão 100% reservados para ele naquele horário nobre.
  * **Política de Faltas Justa:** Se o paciente faltar por motivos pessoais e avisar com antecedência de 24h, ele tem direito a repor a sessão dentro do próprio mês (remarcação via portal do paciente).
  * **Estorno de Intercorrências:** Caso ocorra um cancelamento por parte da clínica ou uma intercorrência médica justificada (ex: cirurgia ou viagem longa comprovada), o sistema gera um crédito/desconto automático na mensalidade do mês seguinte.
* **Previsibilidade:** Excelente. A clínica sabe exatamente o faturamento recorrente no dia 1 do mês.

---

### Opção 2: Contrato Terapêutico por Ciclo Clínico (Reabilitação Fechada)
* **Como funciona:** Fisioterapia de reabilitação tem início, meio e fim (diferente de atividades continuadas como Pilates). Em vez de sessões soltas, o fisioterapeuta prescreve um **Ciclo de Tratamento Clínico** após a avaliação (ex: *"Seu ciclo para tratamento de hérnia discal durará 6 semanas, com 2 atendimentos semanais, totalizando 12 sessões. O investimento é de R$ X, dividido em 2 parcelas mensais."*).
* **Alinhamento Ético (Justiça para o Paciente):**
  * Você não está vendendo sessões "comerciais", você está propondo um **compromisso clínico com a alta**.
  * **Garantia de Alta Antecipada:** Se o paciente evoluir mais rápido e receber alta na 9ª sessão (em vez da 12ª), a clínica reembolsa integralmente o valor proporcional das 3 sessões restantes.
  * **Taxa de Cancelamento Tardio:** Se o paciente abandonar o tratamento no meio por motivos não-médicos, ele paga uma taxa de cancelamento justa (ex: 10% do valor restante) para cobrir o custo de ociosidade da vaga que ficou travada para ele.
* **Previsibilidade:** Média-alta. Garante a receita do ciclo completo de tratamento do paciente.

---

### Opção 3: Sistema de Crédito Recorrente (Caução Mensal)
* **Como funciona:** O paciente paga no dia 1 do mês o valor estimado das sessões previstas para aquele mês (ex: se o mês tem 4 semanas e ele faz 2x por semana, são 8 sessões). O dinheiro entra como saldo em sua conta. A cada sessão realizada, o saldo é debitado.
* **Alinhamento Ético (Justiça para o Paciente):**
  * Se no final do mês o paciente realizou apenas 7 sessões (porque viajou ou faltou com aviso prévio), o valor de 1 sessão **acumula como saldo positivo** para o mês seguinte ou é devolvido via Pix de forma transparente pelo sistema.
  * O paciente nunca perde o dinheiro de sessões não realizadas, mas a clínica garante o caixa no início do mês e ativa o compromisso psicológico do paciente em comparecer para não deixar o saldo parado.
* **Previsibilidade:** Alta. Garante o caixa adiantado do mês, com ajustes de saldo automáticos gerenciados pelo Kinesis App.

---

### Opção 4: Taxa de Reserva Concierge + Consumo de Sessões
* **Como funciona:** Um modelo híbrido. O paciente paga uma taxa mensal fixa de baixo valor (ex: R$ 100/mês) apenas para **garantir a reserva exclusiva do seu horário fixo** ao longo do ano na clínica. As sessões em si continuam sendo cobradas individualmente no final do mês baseado no consumo.
* **Alinhamento Ético (Justiça para o Paciente):**
  * O paciente entende o valor de ter um horário nobre garantido (ex: 19h) exclusivo para ele, sem risco de ser ocupado.
  * Se ele faltar sem aviso prévio de 24h, a sessão é cobrada normalmente, pois a clínica manteve o profissional e a estrutura reservados exclusivamente para ele.
* **Previsibilidade:** Média. A taxa fixa dá uma linha de base de receita garantida e as faltas sem aviso deixam de dar prejuízo financeiro.

---

## 📝 Bloco de Notas de Ideias (Rascunho Rápido)

*Use esta seção para escrever novas ideias à medida que surgirem. Eu te ajudarei a detalhá-las e transformá-las em especificações técnicas para nosso projeto.*

* **[Ideia 1]** *(Escreva aqui sua ideia...)*
* **[Ideia 2]** *(Escreva aqui sua ideia...)*
* **[Ideia 3]** *(Escreva aqui sua ideia...)*

---

### 🛠️ Como aplicar qualquer ideia no projeto:
1. **Passo 1:** Defina a ideia no Bloco de Notas acima.
2. **Passo 2:** Peça-me para analisar a ideia específica. Vou detalhar as tabelas do Prisma que ela afeta, os arquivos de rota (`src/app/api/...`) ou páginas que precisamos criar/alterar.
3. **Passo 3:** Juntos, criaremos um plano de implementação (`implementation_plan.md`) para aprovação e, em seguida, executaremos passo a passo!
