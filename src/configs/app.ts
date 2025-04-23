import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './database';
import session from 'express-session';
import passport from './passport';
import { errorHandler } from '../middlewares/errorHandler';
import routes from '../routes/index';

const app = express();
connectDB();

// Middlewares
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
app.use(helmet());
app.use(morgan('dev')); // logging middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // serve static files from public directory
app.use('/api/v1', routes);
app.use(errorHandler); // should be last middleware

export default app;
