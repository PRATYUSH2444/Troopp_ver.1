import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class CheckInPoint extends Model {}

CheckInPoint.init(
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
    label: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        min: -90,
        max: 90,
      },
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        min: -180,
        max: 180,
      },
    },
    radius_meters: {
      type: DataTypes.INTEGER,
      defaultValue: 100, // Margin of error in meters
      allowNull: false,
    },
    scheduled_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CheckInPoint',
    tableName: 'check_in_points',
    timestamps: true,
    paranoid: false,
  }
)

export default CheckInPoint
