import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class Message extends Model {}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    trip_room_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    message_type: {
      type: DataTypes.ENUM(
        'text',
        'announcement',
        'image',
        'video',
        'audio',
        'document',
        'location',
        'live_location',
        'contact',
        'system',
        'member_joined_system',
        'member_left_system'
      ),
      defaultValue: 'text',
      allowNull: false,
    },
    media: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    reply_to_message_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    edited_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    edit_history: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    deleted_for: {
      type: DataTypes.ENUM('none', 'everyone'),
      defaultValue: 'none',
      allowNull: false,
    },
    client_temp_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    location_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    contact_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
    paranoid: true, // Enables paranoid soft delete
    indexes: [
      {
        fields: ['trip_room_id', 'created_at'],
      },
      {
        fields: ['client_temp_id'],
      },
    ],
  }
)

export default Message
