import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class MessageDeletedUser extends Model {}

MessageDeletedUser.init(
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
    deleted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MessageDeletedUser',
    tableName: 'message_deleted_users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['message_id', 'user_id'],
      },
    ],
  }
)

export default MessageDeletedUser
