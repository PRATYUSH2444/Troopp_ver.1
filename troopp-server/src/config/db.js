import { Sequelize } from 'sequelize'
import logger from './logger.js'

const {
  DATABASE_URL,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_POOL_MIN,
  DB_POOL_MAX,
  NODE_ENV
} = process.env

let sequelize

if (DATABASE_URL) {
  const cleanDbUrl = DATABASE_URL.includes('sslmode=require')
    ? DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full')
    : DATABASE_URL

  sequelize = new Sequelize(cleanDbUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: (msg) => {
      if (NODE_ENV === 'development') {
        logger.debug(msg)
      }
    },
    pool: {
      min: parseInt(DB_POOL_MIN || '2', 10),
      max: parseInt(DB_POOL_MAX || '10', 10),
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
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
      max: 3,
    }
  })
} else {
  sequelize = new Sequelize(DB_NAME || 'troopp', DB_USER || 'postgres', DB_PASSWORD || 'postgres', {
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
      underscored: true,
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
      max: 3,
    }
  })
}

// Set up query timeout middleware interceptor (5 seconds query timeout)
sequelize.addHook('beforeQuery', (options) => {
  options.timeout = 5000 // 5 seconds query timeout
})

export { sequelize, Sequelize }
export default sequelize
