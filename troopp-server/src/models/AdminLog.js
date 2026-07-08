import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class AdminLog extends Model {}

AdminLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    admin_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    target_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    target_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AdminLog',
    tableName: 'admin_logs',
    timestamps: true,
    paranoid: false,
  }
)

export default AdminLog
