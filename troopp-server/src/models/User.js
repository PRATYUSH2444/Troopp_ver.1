import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'
import logger from '../config/logger.js'
import { getRedisClient, isRedisHealthy } from '../config/redis.js'

class User extends Model {
  // Static Helper Methods
  static findByEmail(email) {
    return this.findOne({ where: { email: email.toLowerCase().trim() } })
  }

  static findActiveByCity(cityId) {
    return this.findAll({
      where: {
        city_id: cityId,
        account_status: 'active'
      }
    })
  }

  // Instance Helper Methods
  isBannedOrSuspended() {
    if (this.account_status === 'banned') {
      return true
    }
    if (this.account_status === 'suspended') {
      if (this.suspension_until && new Date() < new Date(this.suspension_until)) {
        return true
      }
    }
    return false
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
      set(val) {
        this.setDataValue('email', val.toLowerCase().trim())
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        len: [10, 20],
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true, // Nullable for Google OAuth users
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    is_phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('member', 'admin'),
      defaultValue: 'member',
      allowNull: false,
    },
    trust_score: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    reliability_score: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    score_frozen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    account_status: {
      type: DataTypes.ENUM('active', 'suspended', 'deactivated', 'banned'),
      defaultValue: 'active',
      allowNull: false,
    },
    ban_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    suspension_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    onboarding_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    online_status_visible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    last_active_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    interest_tags: {
      type: DataTypes.JSON,
      allowNull: true, // Array of strings representing travel style tags
    },
    tos_accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    city_id: {
      type: DataTypes.UUID,
      allowNull: true, // Settable during profile onboarding
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lockout_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete enabled
    hooks: {
      // NOTE: Raw SQL updates bypassing Sequelize entirely will NOT trigger these hooks.
      // Any such operations MUST call redis.del(`user:session:${userId}`) explicitly.
      afterUpdate: async (user, options) => {
        try {
          if (isRedisHealthy()) {
            const redis = getRedisClient()
            await redis.del(`user:session:${user.id}`)
          }
        } catch (err) {
          logger.error('Failed to invalidate user cache on update:', err)
        }
      },
      afterDestroy: async (user, options) => {
        try {
          if (isRedisHealthy()) {
            const redis = getRedisClient()
            await redis.del(`user:session:${user.id}`)
          }
        } catch (err) {
          logger.error('Failed to invalidate user cache on destroy:', err)
        }
      },
      afterBulkUpdate: async (options) => {
        try {
          if (!isRedisHealthy() || !options.where) return
          const redis = getRedisClient()

          // Helper to recursively parse Symbol keys (e.g. Op.and) in Sequelize queries
          const extractIds = (where) => {
            if (!where || typeof where !== 'object') return []
            let ids = []

            if (where.id) {
              if (typeof where.id === 'string') {
                ids.push(where.id)
              } else if (Array.isArray(where.id)) {
                ids.push(...where.id)
              } else if (typeof where.id === 'object') {
                const innerSymbols = Object.getOwnPropertySymbols(where.id).concat(Object.keys(where.id))
                for (const sym of innerSymbols) {
                  if (Array.isArray(where.id[sym])) {
                    ids.push(...where.id[sym])
                  } else if (typeof where.id[sym] === 'string') {
                    ids.push(where.id[sym])
                  }
                }
              }
            }

            const symbols = Object.getOwnPropertySymbols(where)
            for (const sym of symbols) {
              const val = where[sym]
              if (Array.isArray(val)) {
                for (const item of val) {
                  ids.push(...extractIds(item))
                }
              } else if (val && typeof val === 'object') {
                ids.push(...extractIds(val))
              }
            }

            const keys = Object.keys(where)
            for (const key of keys) {
              const val = where[key]
              if (Array.isArray(val)) {
                for (const item of val) {
                  ids.push(...extractIds(item))
                }
              } else if (val && typeof val === 'object') {
                ids.push(...extractIds(val))
              }
            }

            return [...new Set(ids)]
          }

          const ids = extractIds(options.where)
          if (ids.length > 0) {
            const keys = ids.map(id => `user:session:${id}`)
            await redis.del(...keys)
            logger.info(`Bulk update hook cleared session cache for users: ${ids.join(', ')}`)
          }
        } catch (err) {
          logger.error('Failed to invalidate user cache on bulk update:', err)
        }
      }
    }
  }
)

export default User
