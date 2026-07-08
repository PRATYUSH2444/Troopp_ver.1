import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class TripRule extends Model {}

TripRule.init(
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
    language: {
      type: DataTypes.ENUM('hindi', 'english', 'both'),
      defaultValue: 'english',
      allowNull: false,
    },
    members_can_add_expenses: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    members_can_create_polls: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    chat_before_full: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    moderated_mode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    phone_sharing_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    checkin_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    safety_briefing_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000],
      },
    },
  },
  {
    sequelize,
    modelName: 'TripRule',
    tableName: 'trip_rules',
    timestamps: true,
    paranoid: false,
  }
)

export default TripRule
