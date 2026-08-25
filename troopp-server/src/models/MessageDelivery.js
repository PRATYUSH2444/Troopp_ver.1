import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class MessageDelivery extends Model {}

MessageDelivery.init(
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
    delivered_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MessageDelivery',
    tableName: 'message_deliveries',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['message_id', 'user_id'],
      },
    ],
  }
)

export default MessageDelivery
