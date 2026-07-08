import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class ActivityReport extends Model {}

ActivityReport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reporter_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
      defaultValue: 'pending',
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ActivityReport',
    tableName: 'activity_reports',
    timestamps: true,
    paranoid: false,
  }
)

export default ActivityReport
