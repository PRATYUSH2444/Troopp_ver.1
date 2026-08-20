import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class CommunityReport extends Model {}

CommunityReport.init(
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
    target_type: {
      type: DataTypes.ENUM('post', 'comment'),
      allowNull: false,
    },
    target_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM('open', 'reviewed', 'actioned'),
      defaultValue: 'open',
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'CommunityReport',
    tableName: 'community_reports',
    timestamps: true,
    paranoid: false,
  }
)

export default CommunityReport
