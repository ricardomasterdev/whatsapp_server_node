/**
 * whatsapp_server.js
 *
 * Servidor WhatsApp Web via whatsapp-web.js, com API REST protegida por token e documentação Swagger.
 * Habilita CORS, expõe endpoint POST /send e UI interativa em /api-docs.
 */

// Importações principais
const { Client, LocalAuth } = require('whatsapp-web.js'); // cliente WhatsApp Web
const qrcode = require('qrcode-terminal');                // para gerar QR code no terminal
const express = require('express');                       // framework HTTP
const bodyParser = require('body-parser');                // parse de JSON
const cors = require('cors');                             // habilita CORS
const swaggerUi = require('swagger-ui-express');          // serve Swagger UI

// Configurações básicas
const app = express();
const PORT = 3000;

// ====================
// ===== MIDDLEWARE ===
// ====================

// Habilita CORS para todas as origens (em produção, restrinja as origens conforme necessário)
app.use(cors());

// Parser de JSON para requisições HTTP
app.use(bodyParser.json());


// ===========================
// ===== TOKEN DE SEGURANÇA ==
// ===========================
const API_TOKEN = 'Ric@7901'; // Substitua por um token forte de sua escolha


// =========================
// ===== Cliente WhatsApp ==
// =========================
const client = new Client({
    authStrategy: new LocalAuth(),  // armazena sessão localmente
    puppeteer: { headless: true }   // execuçã0 sem janela visível
});

let isReady = false;  // indica quando o cliente estiver pronto

// Gera QR code para login na primeira vez
client.on('qr', qr => {
    console.log('\n[QR] Escaneie o QR code nas configurações do WhatsApp > Dispositivos Conectados:\n');
    qrcode.generate(qr, { small: true });
    console.log('\n[Aguardando] autenticação via QR code...');
});

// Sinaliza que o cliente está pronto para enviar mensagens
client.on('ready', () => {
    isReady = true;
    console.log('✅ Cliente WhatsApp Web autenticado e pronto!');
});


// ====================================
// ===== Definição do swaggerDocument ==
// ====================================
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'WhatsApp Messaging API',
        description: 'API REST para envio de mensagens via WhatsApp Web',
        version: '1.0.0'
    },
    servers: [
        { url: '/' }

    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    security: [
        { bearerAuth: [] }
    ],
    paths: {
        '/send': {
            post: {
                summary: 'Envia uma mensagem no WhatsApp para o número informado',
                tags: ['Mensagens'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    numero: {
                                        type: 'string',
                                        description: 'Telefone em DDI+DDD+Número (ex: 556299999999)'
                                    },
                                    mensagem: {
                                        type: 'string',
                                        description: 'Texto da mensagem a ser enviada'
                                    }
                                },
                                required: ['numero', 'mensagem']
                            },
                            example: {
                                numero: '5591987654321',
                                mensagem: 'Olá! Esta é uma mensagem de teste.'
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Mensagem enviada com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string' }
                                    },
                                    example: { status: 'enviado' }
                                }
                            }
                        }
                    },
                    '400': { description: 'Requisição malformada (faltando numero ou mensagem)' },
                    '401': { description: 'Token de autenticação ausente ou inválido' },
                    '404': { description: 'Número não registrado no WhatsApp' },
                    '503': { description: 'Cliente WhatsApp não conectado (aguardando autenticação)' },
                    '500': { description: 'Erro interno ao enviar mensagem' }
                }
            }
        }
    }
};

// Monta o Swagger UI em /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// ==========================
// ===== Endpoint /send =====
// ==========================
app.post('/send', async (req, res) => {
    // 1) verifica token Bearer no header Authorization
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${API_TOKEN}`) {
        return res.status(401).json({ error: 'Token inválido ou ausente' });
    }

    // 2) verifica se WhatsApp Web está pronto
    if (!isReady) {
        return res.status(503).json({ error: 'WhatsApp Web não conectado' });
    }

    // 3) valida corpo da requisição
    const { numero, mensagem } = req.body;
    if (!numero || !mensagem) {
        return res.status(400).json({ error: 'Informe numero e mensagem' });
    }

    // 4) envia mensagem via WhatsApp Web
    const chatId = `${numero}@c.us`;
    try {
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) {
            return res.status(404).json({ error: 'Número não encontrado no WhatsApp' });
        }
        await client.sendMessage(chatId, mensagem);
        console.log(`✅ Mensagem enviada para ${numero}: ${mensagem}`);
        return res.json({ status: 'enviado' });
    } catch (err) {
        console.error('❌ Erro ao enviar mensagem:', err.message);
        return res.status(500).json({ error: err.message });
    }
});


// =====================================
// ===== Inicializa o servidor HTTP ====
// =====================================
// Escuta em todas interfaces ('0.0.0.0') para permitir acesso externo
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando em http://<SEU_HOST_OU_IP>:${PORT}`);
    console.log(`📚 Documentação Swagger em http://<SEU_HOST_OU_IP>:${PORT}/api-docs`);
});

// Inicializa a sessão do WhatsApp
client.initialize();
