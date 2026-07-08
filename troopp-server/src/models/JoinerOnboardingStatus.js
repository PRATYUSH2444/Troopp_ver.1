import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class JoinerOnboardingStatus extends Model {}

JoinerOnboardingStatus.init(
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
    onboarding_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'JoinerOnboardingStatus',
    tableName: 'joiner_onboarding_statuses',
    timestamps: true,
    paranoid: false,
  }
)

export default JoinerOnboardingStatus
