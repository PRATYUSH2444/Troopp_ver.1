import { Sequelize } from 'sequelize'
import logger from './logger.js'

const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_POOL_MIN,
  DB_POOL_MAX,
  NODE_ENV
} = process.env

// Setup Sequelize configurations
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST || '127.0.0.1',
  port: parseInt(DB_PORT || '5432', 10),
  dialect: 'postgres',
  logging: (msg) => {
    if (NODE_ENV === 'development') {
      logger.debug(msg)
    }
  },
  pool: {
    min: parseInt(DB_POOL_MIN || '5', 10),
    max: parseInt(DB_POOL_MAX || '20', 10),
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true, // Use snake_case for DB fields automatically
  },
  retry: {
    match: [
      /ConnectionError/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /TimeoutError/
    ],
    max: 3, // Retry 3 times
  }
})

// Set up query timeout middleware interceptor (5 seconds query timeout)
sequelize.addHook('beforeQuery', (options) => {
  options.timeout = 5000 // 5 seconds query timeout
})

export { sequelize, Sequelize }
export default sequelize
