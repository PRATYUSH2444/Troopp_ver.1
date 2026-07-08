import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class Rating extends Model {}

Rating.init(
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
    rater_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    ratee_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    showed_up: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    respectful: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    safety_vibe: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    overall_rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Rating',
    tableName: 'ratings',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['activity_id', 'rater_id', 'ratee_id'],
      },
    ],
  }
)

export default Rating
