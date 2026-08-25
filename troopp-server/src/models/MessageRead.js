import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class MessageRead extends Model {}

MessageRead.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    message_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    read_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MessageRead',
    tableName: 'message_reads',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['message_id', 'user_id'],
      },
    ],
  }
)

export default MessageRead
