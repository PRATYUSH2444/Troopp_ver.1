import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class TrustScoreLog extends Model {}

TrustScoreLog.init(
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
    old_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    new_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    delta: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    rater_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'TrustScoreLog',
    tableName: 'trust_score_logs',
    timestamps: true,
    paranoid: false,
  }
)

export default TrustScoreLog
