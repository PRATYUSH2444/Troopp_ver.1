import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class Poll extends Model {}

Poll.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    creator_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    question: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    options: {
      type: DataTypes.JSON,
      allowNull: false, // Array of strings e.g. ["Yes", "No", "Maybe"]
    },
    votes: {
      type: DataTypes.JSON,
      defaultValue: {}, // Key-value object of options to user id arrays: { "0": ["user1_id"], "1": [] }
      allowNull: false,
    },
    is_closed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Poll',
    tableName: 'polls',
    timestamps: true,
    paranoid: false,
  }
)

export default Poll
