# Plano de Implementação: Integração da API de WhatsApp no Kinesis App

Este plano detalha a inclusão de um módulo de serviço flexível para conexão com APIs de WhatsApp não oficiais (como Evolution API e Z-API). A integração será configurável via variáveis de ambiente (`.env`), permitindo realizar disparos reais de reengajamento e acompanhamento sem dependências rígidas de código.

---

## 1. Arquitetura da Solução

Criaremos um serviço centralizado de mensageria que detecta o tipo de API de WhatsApp configurada. Caso nenhuma chave real seja fornecida, o sistema se manterá em modo de simulação (escrevendo no console), garantindo que o app continue rodando em desenvolvimento sem problemas.

### Variáveis de Ambiente a serem adicionadas ao `.env`:
```env
# Configurações do WhatsApp
WHATSAPP_API_TYPE="SIMULATED" # Opções: EVOLUTION, Z-API, SIMULATED
WHATSAPP_API_URL=""           # URL base da API contratada/instalada
WHATSAPP_API_KEY=""           # Token/API Key de autorização
WHATSAPP_INSTANCE_NAME=""     # Nome ou ID da instância conectada (ex: kinesis_clinica)
```

---

## 2. Alterações Propostas

### 1. Novo Serviço de Mensageria

#### [NEW] [whatsappService.ts](file:///C:/Users/daniel/.gemini/antigravity/scratch/kinesis-app/src/gestao/services/whatsappService.ts)
Criar o serviço responsável pelas requisições HTTP para a API de WhatsApp selecionada:
* Método `sendTextMessage(phone: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }>`
* Implementação do payload para **Evolution API**:
  * Endpoint: `${WHATSAPP_API_URL}/message/sendText/${WHATSAPP_INSTANCE_NAME}`
  * Headers: `apikey: ${WHATSAPP_API_KEY}`
  * Body: `{ "number": phoneClean, "options": { "delay": 1200, "presence": "composing" }, "text": text }`
* Implementação do payload para **Z-API**:
  * Endpoint: `${WHATSAPP_API_URL}/instances/${WHATSAPP_INSTANCE_NAME}/token/${WHATSAPP_API_KEY}/send-text`
  * Body: `{ "phone": phoneClean, "message": text }`
* Modo de simulação (`SIMULATED`):
  * Apenas gera logs em console e simula o sucesso.

### 2. Integração no Serviço de Reengajamento

#### [MODIFY] [reengagementService.ts](file:///C:/Users/daniel/.gemini/antigravity/scratch/kinesis-app/src/gestao/services/reengagementService.ts)
* Importar o `WhatsappService`.
* No método `triggerReengagement`, substituir o log simulado pela chamada real:
  ```typescript
  const sendResult = await WhatsappService.sendTextMessage(phone, message);
  if (!sendResult.success) {
    console.error(`Falha no envio de WhatsApp para ${phone}:`, sendResult.error);
    // Podemos registrar a falha no log ou prosseguir
  }
  ```

### 3. Configuração de Variáveis de Ambiente

#### [MODIFY] [.env](file:///C:/Users/daniel/.gemini/antigravity/scratch/kinesis-app/.env)
* Inserir as variáveis de ambiente descritas na seção de arquitetura com o tipo padrão `"SIMULATED"`.

---

## 3. Plano de Verificação

### Testes Manuais (Simulador)
1. Certificar que o disparo de reengajamento continua funcionando normalmente no modo `SIMULATED` (logs são impressos no terminal do Next.js).

### Testes de Integração Real (A critério do usuário)
1. Ao configurar as chaves da Evolution API ou Z-API no `.env` do servidor, disparar um reengajamento a partir da tela de pacientes e verificar o recebimento real no número de telefone celular de teste.
