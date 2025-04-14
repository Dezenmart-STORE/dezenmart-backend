import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './database';
import { errorHandler } from '../middlewares/errorHandler';

const app = express();
connectDB();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev')); // logging middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(errorHandler); // should be last middleware

export default app;
