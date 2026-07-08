import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class TripWelcomeMessage extends Model {}

TripWelcomeMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    sequelize,
    modelName: 'TripWelcomeMessage',
    tableName: 'trip_welcome_messages',
    timestamps: true,
    paranoid: false,
  }
)

export default TripWelcomeMessage
