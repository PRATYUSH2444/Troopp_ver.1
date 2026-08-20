import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class PollVote extends Model {}

PollVote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    option_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'PollVote',
    tableName: 'poll_votes',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['post_id', 'user_id'], // One vote per user per poll
      },
    ],
  }
)

export default PollVote
