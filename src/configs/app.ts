import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './database';
import session from 'express-session';
import passport from './passport';
import { errorHandler } from '../middlewares/errorHandler';
import routes from '../routes/index';
import { swaggerSpec } from '../swagger/index';
import { getAllowedFrontendOrigins } from '../utils/allowedOrigins';

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
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin header) and allowlisted frontends
      if (!origin || getAllowedFrontendOrigins().includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);
app.use(morgan('dev')); // logging middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // serve static files from public directory
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api/v1', routes);
app.use(errorHandler); // should be last middleware

export default app;
