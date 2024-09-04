import express from 'express';
import session from 'express-session';
import cors from 'cors';
import passport from 'passport';
import fileUpload from 'express-fileupload';
import 'dotenv/config';
// const cloudinary = require('cloudinary').v2;
import cloudinary from 'cloudinary';
import { redisStore } from './config/redisconnect.js';
// Routes
import routers from './routes/index.js';
import authRouter from './routes/auth.route.js';

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

// Passport config
import passportConfig from './config/passport.js';
import { checkLockStatus } from './utils/permission.js';
passportConfig();

const app = express();
const PORT = process.env.APP_PORT;

// app.set('trust proxy', 1);

app.use(
  cors({
    origin: ['http://localhost:5173', "https://thesis-bkartisan.vercel.app"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true }));

app.use(
  session({
    name: process.env.SESSION_NAME,
    store: redisStore,
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: true,
      secure: false,
      path: '/',
    },
  })
);

app.use((req, res, next) => {
  console.log(`${req.method}:${req.url}`);
  next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use(checkLockStatus);

// Use API design best practice
app.use('/api/v1', routers);
app.use('/', authRouter);

export default app;
