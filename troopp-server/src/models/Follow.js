import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class Follow extends Model {}

Follow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    follower_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    following_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Follow',
    tableName: 'follows',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['follower_id', 'following_id'],
      },
    ],
  }
)

export default Follow
