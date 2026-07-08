import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class ActivityMember extends Model {}

ActivityMember.init(
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
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'member',
      allowNull: false,
    },
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    no_show_checked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ActivityMember',
    tableName: 'activity_members',
    timestamps: true,
    paranoid: false,
  }
)

export default ActivityMember
