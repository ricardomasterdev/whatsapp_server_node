const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// ===== TOKEN DE SEGURANÇA =====
const API_TOKEN = 'Ric@7901'; // TROQUE por algo seguro

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

// Definição da documentação Swagger (OpenAPI) da API
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'WhatsApp Messaging API',
        description: 'API REST para envio de mensagens WhatsApp via WhatsApp Web',
        version: '1.0.0'
    },
    servers: [
  { url: 'http://localhost:3000' },
  { url: 'http://app1.cdxsistemas.com.br:3000' }
  ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'  // formato do token (ex.: JWT) – opcional, apenas descritivo
            }
        }
    },
    security: [
        { bearerAuth: [] }  // Aplica o esquema de segurança Bearer globalmente
    ],
    paths: {
        '/send': {
            post: {
                summary: 'Envia uma mensagem WhatsApp para o número especificado',
                tags: ['Mensagens'],
                security: [
                    { bearerAuth: [] }  // exige token Bearer neste endpoint
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    numero: {
                                        type: 'string',
                                        description: 'Número de telefone em formato internacional (com DDI e DDD)'
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
                                mensagem: 'Olá, esta é uma mensagem de teste via API.'
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
                    '400': { description: 'Número ou mensagem não fornecido na requisição (campos faltando)' },
                    '401': { description: 'Token de autenticação ausente ou inválido' },
                    '404': { description: 'Número não encontrado no WhatsApp (número não registrado)' },
                    '503': { description: 'WhatsApp Web não conectado no momento (aguardando login)' },
                    '500': { description: 'Erro interno no servidor ao tentar enviar a mensagem' }
                }
            }
        }
    }
};
// 1️⃣ Monta o Swagger UI antes do listen:
const swaggerUi = require('swagger-ui-express');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 2️⃣ Faz o servidor escutar em 0.0.0.0 para aceitar conexões externas:
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Swagger UI disponível em http://<SEU_HOST_OU_IP>:${PORT}/api-docs`);
});

// Inicializa o cliente WhatsApp
client.initialize();