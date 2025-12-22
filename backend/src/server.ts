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
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:8081', // Expo dev web
    'exp://localhost:8081', // Expo dev
    /^exp:\/\/192\.168\.\d+\.\d+:8081$/, // Expo dev em rede local
    /^http:\/\/192\.168\.\d+\.\d+:8081$/, // Expo dev web em rede local
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

