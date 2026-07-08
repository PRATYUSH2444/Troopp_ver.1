import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class TripAttendance extends Model {}

TripAttendance.init(
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
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    attended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    rating_submitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'TripAttendance',
    tableName: 'trip_attendances',
    timestamps: true,
    paranoid: false,
  }
)

export default TripAttendance
