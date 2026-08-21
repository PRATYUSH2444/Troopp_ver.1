import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

export const DEFAULT_CITIES = [
  { id: '11111111-1111-1111-1111-111111111111', city_name: 'Mumbai', state: 'Maharashtra', is_active: true, latitude: 19.0760, longitude: 72.8777 },
  { id: '22222222-2222-2222-2222-222222222222', city_name: 'Delhi NCR', state: 'Delhi', is_active: true, latitude: 28.7041, longitude: 77.1025 },
  { id: '33333333-3333-3333-3333-333333333333', city_name: 'Bengaluru', state: 'Karnataka', is_active: true, latitude: 12.9716, longitude: 77.5946 },
  { id: '44444444-4444-4444-4444-444444444444', city_name: 'Hyderabad', state: 'Telangana', is_active: true, latitude: 17.3850, longitude: 78.4867 },
  { id: '55555555-5555-5555-5555-555555555555', city_name: 'Ahmedabad', state: 'Gujarat', is_active: true, latitude: 23.0225, longitude: 72.5714 },
  { id: '66666666-6666-6666-6666-666666666666', city_name: 'Pune', state: 'Maharashtra', is_active: true, latitude: 18.5204, longitude: 73.8567 },
  { id: '77777777-7777-7777-7777-777777777777', city_name: 'Chennai', state: 'Tamil Nadu', is_active: true, latitude: 13.0827, longitude: 80.2707 },
  { id: '88888888-8888-8888-8888-888888888888', city_name: 'Kolkata', state: 'West Bengal', is_active: true, latitude: 22.5726, longitude: 88.3639 },
  { id: '99999999-9999-9999-9999-999999999999', city_name: 'Jaipur', state: 'Rajasthan', is_active: true, latitude: 26.9124, longitude: 75.7873 },
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', city_name: 'Surat', state: 'Gujarat', is_active: true, latitude: 21.1702, longitude: 72.8311 },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', city_name: 'Goa', state: 'Goa', is_active: true, latitude: 15.2993, longitude: 74.1240 },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', city_name: 'Chandigarh', state: 'Punjab', is_active: true, latitude: 30.7333, longitude: 76.7794 }
]

class City extends Model {
  static findActive() {
    return this.findAll({ where: { is_active: true } })
  }

  static async seedDefaultsIfNeeded() {
    try {
      const count = await this.count()
      if (count === 0) {
        await this.bulkCreate(DEFAULT_CITIES, { ignoreDuplicates: true })
      }
    } catch (err) {
      // In case of parallel sync or duplicate key race condition, ignore
    }
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
