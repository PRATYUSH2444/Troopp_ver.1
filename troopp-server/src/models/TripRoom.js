import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class TripRoom extends Model {}

TripRoom.init(
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
    status: {
      type: DataTypes.ENUM('active', 'locked', 'archived'),
      defaultValue: 'active',
      allowNull: false,
    },
    chat_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    pinned_message_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'TripRoom',
    tableName: 'trip_rooms',
    timestamps: true,
    paranoid: false,
  }
)

export default TripRoom
