import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AppDataSource } from './database/data-source';
import routes from './routes';
import { EmailQueueService } from './services/EmailQueueService';
import { SubscriptionController } from './controllers/SubscriptionController';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    // Produção
    'https://orachid.com.br',
    'https://www.orachid.com.br',
    'https://api.orachid.com.br',
    process.env.FRONTEND_URL || 'https://orachid.com.br',
    // Desenvolvimento
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev
    'http://localhost:8081', // Expo dev web
    'exp://localhost:8081', // Expo dev
    /^exp:\/\/192\.168\.\d+\.\d+:8081$/, // Expo dev em rede local
    /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Expo dev web em rede local
    /^http:\/\/192\.168\.\d+\.\d+:3001$/, // Backend acessível via IP
  ],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Webhook route without /api prefix (for Asaas webhook compatibility)
// This allows Asaas to call /subscriptions/webhook directly
// The webhook controller validates the request internally using AsaasService.verifyWebhook
app.post('/subscriptions/webhook', (req, res) => {
  console.log('[Webhook] Received webhook request at /subscriptions/webhook');
  console.log('[Webhook] Event type:', req.body?.event);
  console.log('[Webhook] Resource ID:', req.body?.payment?.subscription || req.body?.payment?.id || req.body?.subscription?.id);
  SubscriptionController.webhook(req as any, res);
});

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Health check com verificação de banco de dados
app.get('/health/db', async (req, res) => {
  try {
    // Verificar se o DataSource está inicializado
    if (!AppDataSource.isInitialized) {
      return res.status(503).json({ 
        status: 'error', 
        database: 'not_initialized',
        message: 'Database connection not initialized' 
      });
    }

    // Tentar fazer uma query simples para verificar conexão
    await AppDataSource.query('SELECT 1');
    
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected',
      message: error.message || 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Iniciar servidor mesmo se o banco falhar (para evitar 502)
// O servidor pode funcionar parcialmente e tentar reconectar
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Tentar conectar ao banco de dados
  AppDataSource.initialize()
    .then(async () => {
      console.log('✅ Database connected successfully');
      
      // Inicializar EmailQueueService após conectar ao banco
      try {
        console.log('🔄 Inicializando EmailQueueService...');
        await EmailQueueService.initialize();
        console.log('🔄 Iniciando workers de email...');
        await EmailQueueService.iniciarWorker();
        console.log('✅ Email queue service initialized and workers started');
        
        // Agendar job diário de reativação
        console.log('🔄 Agendando job diário de reativação...');
        await EmailQueueService.agendarJobReativacao();
        console.log('✅ Job diário de reativação agendado');
        
        // Agendar job de agregação de emails (a cada minuto)
        console.log('🔄 Agendando job de agregação de emails...');
        await EmailQueueService.agendarJobAgregacaoEmails();
        console.log('✅ Job de agregação de emails agendado');
        
        // Agendar job diário de verificação de vencimento próximo
        console.log('🔄 Agendando job de verificação de vencimento próximo...');
        await EmailQueueService.agendarJobVencimentoProximo();
        console.log('✅ Job de verificação de vencimento próximo agendado');
      } catch (error: any) {
        console.error('❌ Error initializing email queue service:', error);
        console.error('Email notifications will not work, but server will continue running');
        console.error('Stack trace:', error.stack);
      }
    })
    .catch((error) => {
      console.error('❌ Error connecting to database:', error);
      console.error('Server is running but database is not connected');
      console.error('Check your environment variables:');
      if (process.env.DATABASE_URL) {
        // Mascarar senha na URL
        const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@');
        console.error('- DATABASE_URL:', maskedUrl);
      } else {
        console.error('- DATABASE_URL: NOT SET');
        console.error('- DB_HOST:', process.env.DB_HOST || 'NOT SET');
        console.error('- DB_PORT:', process.env.DB_PORT || 'NOT SET');
        console.error('- DB_USERNAME:', process.env.DB_USERNAME ? 'SET' : 'NOT SET');
        console.error('- DB_DATABASE:', process.env.DB_DATABASE || 'NOT SET');
      }
    });
});

