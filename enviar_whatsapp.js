const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ===== TOKEN DE SEGURANÇA =====
const API_TOKEN = 'Ric@7901'; // Seu token seguro

// ===== CONFIGURAÇÃO CORS =====
app.use(cors()); // permite chamadas de qualquer origem

// Exemplos de uso mais restrito de CORS:
// app.use(cors({ origin: 'https://meu-dominio-seguro.com' }));
// app.use(cors({ origin: ['http://localhost:3000','http://app1.cdxsistemas.com.br'] }));
// app.use(cors({ origin: 'https://meu-dominio.com', credentials: true }));
// app.use(cors({ origin: 'https://meu-dominio.com', methods: ['POST'], allowedHeaders: ['Content-Type','Authorization'] }));

app.use(bodyParser.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

let isReady = false;

client.on('qr', qr => {
    console.log('\n*** ESCANEIE O QR CODE ABAIXO NO SEU CELULAR (WhatsApp > Dispositivos Conectados):\n');
    qrcode.generate(qr, { small: true });
    console.log('\nAguarde login ser aceito!\n');
});

client.on('ready', () => {
    isReady = true;
    console.log('✅ Cliente WhatsApp Web pronto para receber comandos!');
});

// ======= API protegida por token =======
app.post('/send', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${API_TOKEN}`) {
        return res.status(401).json({ error: 'Token inválido ou ausente' });
    }
    if (!isReady) {
        return res.status(503).json({ error: 'WhatsApp não conectado' });
    }
    const { numero, mensagem } = req.body;
    if (!numero || !mensagem) {
        return res.status(400).json({ error: 'Informe numero e mensagem' });
    }
    const chatId = `${numero}@c.us`;
    try {
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) {
            return res.status(404).json({ error: 'Número não encontrado no WhatsApp' });
        }
        await client.sendMessage(chatId, mensagem);
        console.log(`✅ Mensagem enviada para ${numero}: ${mensagem}`);
        res.json({ status: 'enviado' });
    } catch (err) {
        console.error('Erro ao enviar mensagem:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Swagger setup (mantém seu swaggerDocument)
const swaggerUi = require('swagger-ui-express');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Inicia servidor em todas as interfaces
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor WhatsApp REST rodando em http://localhost:${PORT}`);
    console.log(`Swagger UI disponível em http://localhost:${PORT}/api-docs`);
});

client.initialize();
