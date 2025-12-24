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

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to database:', error);
  });

