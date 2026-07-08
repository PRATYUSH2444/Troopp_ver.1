import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class UserFCMToken extends Model {}

UserFCMToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fcm_token: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    device_label: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_used_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'UserFCMToken',
    tableName: 'user_fcm_tokens',
    timestamps: true,
    paranoid: false,
  }
)

export default UserFCMToken
