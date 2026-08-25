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
    room_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    room_photo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    archived_at: {
      type: DataTypes.DATE,
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
