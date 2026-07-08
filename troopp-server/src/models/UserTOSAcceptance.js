import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class UserTOSAcceptance extends Model {}

UserTOSAcceptance.init(
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
    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '1.0.0',
    },
    accepted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'UserTOSAcceptance',
    tableName: 'user_tos_acceptance',
    timestamps: true,
    paranoid: false,
  }
)

export default UserTOSAcceptance
