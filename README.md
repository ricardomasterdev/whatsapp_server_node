# 📲 WhatsApp Server Node.js (API REST para envio automático de mensagens)

Servidor WhatsApp integrado ao `whatsapp-web.js`, com API REST local protegida por token para automação de notificações e integrações via Python, Postman ou qualquer outra aplicação.

---

## 🚀 Funcionalidades

- Envio de mensagens WhatsApp via requisição HTTP POST  
- Sessão autenticada local (não precisa escanear QR code a cada envio)  
- Token de segurança Bearer para proteger seu endpoint  
- Fácil integração com Python, sistemas de alerta, RPA, bots etc.  
- Código aberto e fácil de instalar  

---

## ⚡ Requisitos

- **Node.js** versão 18 ou superior  
- **Chrome/Chromium** instalado (Puppeteer baixa automaticamente se necessário)  
- Conexão com **Internet** para autenticação no WhatsApp Web  

---

## 🛠️ Instalação e Configuração

### 1. Clone ou baixe o projeto

```bash
git clone https://github.com/ricardomasterdev/whatsapp_server_node.git
cd whatsapp_server_node
Ou simplesmente baixe e extraia o ZIP em uma pasta do seu computador.

2. Instale as dependências Node.js
bash
Copiar
Editar
npm install
Isso vai baixar todas as dependências listadas no package.json.

3. Configure o token de acesso
Abra o arquivo whatsapp_server.js e altere a constante:

js
Copiar
Editar
const API_TOKEN = 'SEU_TOKEN_SUPERSECRETO'; // TROQUE por um token forte!
Atenção:

Guarde este token em segredo.

Se desconfiar de vazamento, troque o token e reinicie o servidor.

4. Inicie o servidor WhatsApp
bash
Copiar
Editar
npm start
# ou
node whatsapp_server.js
Na primeira execução, será exibido um QR code no terminal.

Abra o WhatsApp no celular → Dispositivos Conectados → Conectar novo dispositivo → escaneie o QR code.

O servidor ficará rodando aguardando requisições via API.

🔒 Segurança
Proteja sempre seu endpoint com um token seguro.

Não exponha a porta 3000 em redes públicas sem firewall ou proxy.

Em caso de suspeita de comprometimento, troque o token imediatamente.

📤 Como enviar mensagem (exemplo Python)
python
Copiar
Editar
import requests

url     = 'http://localhost:3000/send'
token   = 'SEU_TOKEN_SUPERSECRETO'  # igual ao do Node.js!
dados   = { "numero": "5562999999999", "mensagem": "Olá do Python!" }
headers = { "Authorization": f"Bearer {token}" }

r = requests.post(url, json=dados, headers=headers)
print(r.json())
Formato do número: DDI+DDD+NUMERO, sem sinais (ex: 5562999999999).

Swagger UI disponível em http://<SEU_HOST_OU_IP>:3000/api-docs



🛠️ Outras dicas e observações
Se trocar de computador ou deletar a pasta .wwebjs_auth, será necessário reescanear o QR code.

Se o WhatsApp Web sair da sessão, reinicie o servidor e reescaneie.

Pode rodar o servidor como serviço do Windows (Task Scheduler) ou daemon no Linux (systemd).

🏷️ Licença
Este projeto é open source (licença MIT). Use, modifique e contribua!

🤝 Suporte
Dúvidas, bugs ou sugestões?
Abra uma issue ou envie um PR no GitHub.