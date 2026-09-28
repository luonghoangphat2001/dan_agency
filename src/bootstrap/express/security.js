'use strict';

const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const config = require('@config');

function configureSecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());

  const allowedOrigins = config.cors.origins;

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    maxAge: 3600,
  };

  // Respond to all OPTIONS preflight requests immediately.
  // This must come before any other middleware so that reverse proxies
  // (Nginx / Caddy upstream) that strip CORS headers still get a valid 204.
  app.options('*', cors(corsOptions));

  app.use(cors(corsOptions));
}

module.exports = configureSecurity;
