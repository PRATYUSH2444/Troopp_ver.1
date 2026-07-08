import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class NotificationPreference extends Model {}

NotificationPreference.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    new_activities: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    trip_updates: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    join_updates: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    score_changes: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    social: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    safety: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      validate: {
        isAlwaysTrue(val) {
          if (!val) {
            throw new Error('Safety notifications cannot be disabled.')
          }
        }
      }
    },
    admin_broadcasts: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      validate: {
        isAlwaysTrue(val) {
          if (!val) {
            throw new Error('Admin broadcasts cannot be disabled.')
          }
        }
      }
    },
  },
  {
    sequelize,
    modelName: 'NotificationPreference',
    tableName: 'notification_preferences',
    timestamps: true,
    paranoid: false,
  }
)

export default NotificationPreference
