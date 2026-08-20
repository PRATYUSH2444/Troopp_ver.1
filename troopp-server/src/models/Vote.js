import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class Vote extends Model {}

Vote.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    target_type: {
      type: DataTypes.ENUM('post', 'comment'),
      allowNull: false,
    },
    target_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    vote_value: {
      type: DataTypes.INTEGER, // +1 or -1
      allowNull: false,
      validate: {
        isIn: [[-1, 1]],
      },
    },
  },
  {
    sequelize,
    modelName: 'Vote',
    tableName: 'votes',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'target_type', 'target_id'],
      },
    ],
  }
)

export default Vote
