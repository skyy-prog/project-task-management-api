require('dotenv').config({ quiet: true });
const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(5000),

  MYSQL_HOST: Joi.string().required(),
  MYSQL_PORT: Joi.number().port().default(3306),
  MYSQL_USER: Joi.string().required(),
  MYSQL_PASSWORD: Joi.string().allow('').default(''),
  MYSQL_DATABASE: Joi.string().required(),

  MONGO_URI: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),

  CORS_ORIGIN: Joi.string().default('*'),

  RATE_LIMIT_WINDOW_MS: Joi.number().integer().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().integer().positive().default(300),
  AUTH_RATE_LIMIT_MAX: Joi.number().integer().positive().default(30),
}).unknown(true);

const { error, value } = schema.validate(process.env, { abortEarly: false });

if (error) {
  const details = error.details.map((item) => `  - ${item.message}`).join('\n');
  console.error(`Invalid environment configuration:\n${details}`);
  process.exit(1);
}

module.exports = Object.freeze({
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  mysql: Object.freeze({
    host: value.MYSQL_HOST,
    port: value.MYSQL_PORT,
    user: value.MYSQL_USER,
    password: value.MYSQL_PASSWORD,
    database: value.MYSQL_DATABASE,
  }),
  mongoUri: value.MONGO_URI,
  jwt: Object.freeze({
    secret: value.JWT_SECRET,
    expiresIn: value.JWT_EXPIRES_IN,
  }),
  bcryptSaltRounds: value.BCRYPT_SALT_ROUNDS,
  corsOrigin: value.CORS_ORIGIN,
  rateLimit: Object.freeze({
    windowMs: value.RATE_LIMIT_WINDOW_MS,
    max: value.RATE_LIMIT_MAX,
    authMax: value.AUTH_RATE_LIMIT_MAX,
  }),
});
