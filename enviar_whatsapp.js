const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// ===== TOKEN DE SEGURANÇA =====
const API_TOKEN = 'S5BfKSDsS'; // TROQUE por algo seguro

app.use(bodyParser.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('\n*** ESCANEIE O QR CODE ABAIXO NO SEU CELULAR (WhatsApp > Dispositivos Conectados):\n');
    qrcode.generate(qr, {small: true});
    console.log('\nAguarde login ser aceito!\n');
});

client.on('ready', () => {
    isReady = true;
    console.log('✅ Cliente WhatsApp Web pronto para receber comandos!');
});

// ======= API protegida por token =======
app.post('/send', async (req, res) => {
    // VALIDAÇÃO DO TOKEN
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${API_TOKEN}`) {
        return res.status(401).json({error: 'Token inválido ou ausente'});
    }

    if (!isReady) return res.status(503).json({error: 'WhatsApp não conectado'});
    const { numero, mensagem } = req.body;
    if (!numero || !mensagem) return res.status(400).json({error: 'Informe numero e mensagem'});
    const chatId = `${numero}@c.us`;
    try {
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) return res.status(404).json({error: 'Número não encontrado no WhatsApp'});
        await client.sendMessage(chatId, mensagem);
        res.json({status: 'enviado'});
        console.log(`✅ Mensagem enviada para ${numero}: ${mensagem}`);
    } catch (err) {
        res.status(500).json({error: err.message});
        console.error('Erro ao enviar mensagem:', err.message);
    }
});

// Inicia servidor Node+Express
app.listen(PORT, () => {
    console.log(`Servidor WhatsApp REST rodando na porta ${PORT}`);
});

client.initialize();
