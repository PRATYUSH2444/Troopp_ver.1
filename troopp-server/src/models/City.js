import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class City extends Model {
  static findActive() {
    return this.findAll({ where: { is_active: true } })
  }
}

City.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    city_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    launch_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 12.9716 // Bengaluru coordinates default fallback
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 77.5946
    },
  },
  {
    sequelize,
    modelName: 'City',
    tableName: 'cities',
    timestamps: true,
    paranoid: false,
  }
)

export default City
