import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class MessageReaction extends Model {}

MessageReaction.init(
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
    emoji: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MessageReaction',
    tableName: 'message_reactions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['message_id', 'user_id', 'emoji'],
      },
    ],
  }
)

export default MessageReaction
