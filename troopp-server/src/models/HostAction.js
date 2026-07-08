import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class HostAction extends Model {}

HostAction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    host_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action_type: {
      type: DataTypes.ENUM('mute', 'unmute', 'kick', 'pin', 'unpin', 'disable_chat', 'enable_chat'),
      allowNull: false,
    },
    target_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'HostAction',
    tableName: 'host_actions',
    timestamps: true,
    paranoid: false,
  }
)

export default HostAction
