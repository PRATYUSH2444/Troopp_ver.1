import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class Profile extends Model {}

Profile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 150],
      },
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500],
      },
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: false,
      defaultValue: 'prefer_not_to_say',
    },
    trips_completed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    account_tenure_months: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Profile',
    tableName: 'profiles',
    timestamps: true,
    paranoid: false,
  }
)

export default Profile
