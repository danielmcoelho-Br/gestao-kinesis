# Guia de Integração e Contratação da API do WhatsApp

Este guia apresenta uma análise detalhada das opções de integração do WhatsApp com o sistema Kinesis, cobrindo o funcionamento das APIs oficiais e não oficiais, previsão de custos, vantagens, desvantagens e os riscos de banimento de números.

---

## 1. API Oficial vs. API Não Oficial: Visão Geral

O WhatsApp possui duas categorias principais de integração para sistemas de automação:

| Critério | API Oficial (Meta / Cloud API) | API Não Oficial (Simuladores/WhatsApp Web) |
| :--- | :--- | :--- |
| **Tecnologia** | Servidores oficiais da Meta (Cloud API ou BSPs). | Simulação de protocolo do WhatsApp Web (Evolution, Z-API, Baileys). |
| **Burocracia** | Média/Alta (Exige empresa CNPJ e conta Meta Business verificada). | Nenhuma (Basta ler um QR Code no celular). |
| **Estabilidade** | 100% estável (Nunca cai). | Instável (Pode cair quando o WhatsApp Web atualiza). |
| **Risco de Bloqueio**| **Zero** (Desde que siga as políticas de SPAM). | **Altíssimo** (Detecção de automação e denúncias). |
| **Custos** | Cobrado por conversas de 24h (Tabela Meta) + Plataforma. | Mensalidade fixa do servidor/SaaS (Sem custo por mensagem). |
| **Regras de Envio** | Exige templates pré-aprovados para iniciar conversas. | Permite enviar qualquer mensagem de texto livre a qualquer hora. |

---

## 2. API Oficial (WhatsApp Business API / Cloud API)

A API Oficial é o canal homologado pela Meta. Ela roda diretamente em nuvem e permite conexões de alta escala.

### Como Funciona
Para iniciar uma conversa com o paciente, a clínica deve enviar um **Template de Mensagem** (modelo pré-aprovado pela Meta). Uma vez que o paciente responde, abre-se uma **janela de 24 horas** onde a clínica pode trocar mensagens livres sem custo adicional por mensagem individual.

### Estrutura de Custos (Estimativa)
A Meta cobra por **Conversas (janelas de 24h)** e não por mensagem individual. Existem 4 categorias de conversas:
1. **Serviço (Service):** Iniciadas pelo cliente. As primeiras 1.000 de cada mês são **gratuitas**.
2. **Utilidade (Utility):** Iniciadas pela empresa (notificações de agendamento, confirmações). Custam aprox. **$0.015 USD** (R$ 0,08) por conversa.
3. **Marketing:** Iniciadas pela empresa (promoções, novidades, reengajamento). Custam aprox. **$0.062 USD** (R$ 0,31) por conversa.
4. **Autenticação:** Mensagens de código OTP. Custam aprox. **$0.031 USD** (R$ 0,16).

> [!NOTE]
> Se você disparar uma mensagem de reengajamento (Marketing) e o cliente responder 5 vezes dentro das próximas 24 horas, você pagará apenas **uma única tarifa de conversa de Marketing** (aproximadamente R$ 0,31).

Além do custo da Meta, se você utilizar um intermediário (BSP como Twilio, Zenvia, Blip), há uma mensalidade de plataforma (de R$ 100 a R$ 500/mês). Se conectarmos **diretamente à Cloud API da Meta** no nosso código do Kinesis App, pagaremos **apenas o consumo da Meta** (sem intermediários).

### Vantagens
* **Risco zero de banimento**: O número nunca é bloqueado por automação.
* **Selo Verde (Verificado)**: Possibilidade de solicitar a verificação de marca para a clínica.
* **Sem celular ligado**: Não precisa deixar um celular físico ligado ou conectado à internet.

### Desvantagens
* Burocracia na configuração (criação de conta de desenvolvedor na Meta e verificação de empresa).
* Custo variável por conversas de marketing.

---

## 3. API Não Oficial (Simulação de WhatsApp Web)

Essas APIs usam bibliotecas em Node.js (como *Baileys* ou *Evolution API*) que rodam um "WhatsApp Web em segundo plano" no servidor. Para o WhatsApp, o sistema está fingindo ser um navegador Chrome onde o usuário está digitando muito rápido.

### Como Funciona
Você contrata um serviço SaaS (como *Z-API*, *WPPConnect*, *Evolution API*) ou hospeda o seu próprio servidor. O painel gera um QR Code. Você abre o WhatsApp no celular da clínica, vai em "Aparelhos Conectados" e lê o QR Code. A partir daí, o sistema ganha o controle do celular via código.

### Estrutura de Custos
* **Mensalidade Fixa**: Varia de **R$ 49,00 a R$ 120,00 por mês** por número conectado.
* **Custo por mensagem**: **Zero** (Envios ilimitados).

### Vantagens
* **Extremamente barato**: Sem custo por mensagem, ótimo para quem envia milhares de disparos.
* **Sem burocracia**: Configuração em 2 minutos.
* **Mensagem livre**: Envia qualquer texto sem aprovação prévia.

### Desvantagens e Riscos Críticos (Alerta de Banimento)
> [!CAUTION]
> **Risco de Banimento Definitivo de Número:**
> A Meta possui algoritmos avançados de Inteligência Artificial que monitoram padrões de uso do WhatsApp Web. Se o seu número disparar mensagens idênticas em massa, se o tempo de resposta for instantâneo (característica de robô), ou se vários clientes clicarem no botão "Denunciar SPAM", **o número da sua clínica será banido**.
> * O banimento pode ser temporário (24h a 72h) ou **definitivo** (perda permanente do número de telefone).

* **Instabilidade**: Sempre que o WhatsApp altera sua criptografia ou layout do WhatsApp Web, essas APIs quebram e param de enviar mensagens até que os desenvolvedores lancem uma correção (pode demorar horas ou dias).

---

## 4. O Cenário de Bloqueios e Como Evitar SPAM

O principal gatilho de bloqueio de contas é a **Denúncia do Usuário**. Quando um paciente recebe uma mensagem de um número desconhecido ou que ele não interage há meses, o WhatsApp exibe um botão gigante na tela: **[Bloquear e Denunciar]**. Se 3 a 5 usuários fizerem isso em um curto espaço de tempo, o número é banido automaticamente.

### Boas Práticas para Evitar Bloqueios (Mesmo na API Oficial):
1. **Opt-in Ativo:** O paciente deve saber que receberá mensagens (coloque um aviso na ficha de cadastro).
2. **Personalização Dinâmica:** Nunca envie a mesma mensagem para todos. Use o nome do paciente, data da última sessão e referências reais.
3. **Delay Humano (api não oficial):** Coloque intervalos de tempo aleatórios entre os disparos (ex: entre 10 e 30 segundos de espera por mensagem), simulando digitação.
4. **Opção de Cancelamento (Opt-out):** Sempre finalize mensagens automáticas dando uma saída amigável, ex: *"Caso não queira mais receber nossas mensagens, responda SAIR"*. É melhor o cliente responder SAIR do que clicar no botão de Denunciar.

---

## 5. Recomendação para a Clínica Kinesis

Para uma clínica médica/fisioterapia que preza pela sua marca e tem um número de telefone consolidado que os pacientes já conhecem:

> [!IMPORTANT]
> **Recomendação Principal (Oficial Direta):**
> Integrar diretamente com a **Cloud API Oficial da Meta** (sem intermediários). 
> Como o Kinesis App já é um sistema web próprio em Next.js, nós podemos configurar a Cloud API diretamente nas nossas rotas do backend. 
> 
> * **Custo Fixo:** R$ 0,00.
> * **Custo Variável:** Apenas o consumo real das conversas da Meta (estimado em menos de R$ 50,00/mês para o volume atual de reengajamento e avisos).
> * **Segurança:** Segurança total de que o número principal da clínica nunca será banido.

### Próximos Passos para Contratar a API Oficial:
1. Possuir um **CNPJ ativo** para a clínica.
2. Possuir um site ou página ativa (para validação institucional).
3. Ter acesso à conta do **Meta Business Suite** da clínica (gerenciador de negócios do Facebook/Instagram).
4. Adquirir um número de telefone limpo (que não tenha conta pessoal de WhatsApp ativa, ou excluir a conta existente do aplicativo WhatsApp antes de vincular à API oficial).
