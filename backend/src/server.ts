import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AppDataSource } from './database/data-source';
import routes from './routes';

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
    .then(() => {
      console.log('✅ Database connected successfully');
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

