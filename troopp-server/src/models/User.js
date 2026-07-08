import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

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

  getTrustBadge(hasActiveReport = false) {
    if (hasActiveReport) {
      return { label: 'Flagged', color: '#DC2626', emoji: '⚠' }
    }
    if (this.is_id_verified && this.trust_score >= 75) {
      return { label: 'Trusted Legend', color: '#4fbe8e', emoji: '👑' }
    }
    if (this.is_id_verified && this.trust_score >= 50) {
      return { label: 'Verified Explorer', color: '#3b82f6', emoji: '🛡️' }
    }
    return { label: 'New Seed', color: '#6b757c', emoji: '🌱' }
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
    is_id_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    is_face_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    id_document_url: {
      type: DataTypes.STRING(255),
      allowNull: true, // Secure URL stored in private Cloudinary bucket
    },
    id_metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    selfie_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    verification_status: {
      type: DataTypes.ENUM('pending', 'verified', 'failed', 'manual_review'),
      defaultValue: 'pending',
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('member', 'admin'),
      defaultValue: 'member',
      allowNull: false,
    },
    trust_score: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
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
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete enabled
  }
)

export default User
