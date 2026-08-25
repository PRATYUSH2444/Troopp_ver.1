import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class MessageStar extends Model {}

MessageStar.init(
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
  },
  {
    sequelize,
    modelName: 'MessageStar',
    tableName: 'message_stars',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['message_id', 'user_id'],
      },
    ],
  }
)

export default MessageStar
