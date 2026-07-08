import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class TokenBlacklist extends Model {}

TokenBlacklist.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'TokenBlacklist',
    tableName: 'token_blacklist',
    timestamps: true,
    paranoid: false,
  }
)

export default TokenBlacklist
