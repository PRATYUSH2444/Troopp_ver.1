import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class EmergencyContact extends Model {}

EmergencyContact.init(
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
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 20],
      },
    },
    relationship: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'EmergencyContact',
    tableName: 'emergency_contacts',
    timestamps: true,
    paranoid: false,
  }
)

export default EmergencyContact
