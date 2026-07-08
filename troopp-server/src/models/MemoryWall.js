import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class MemoryWall extends Model {}

MemoryWall.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: 'MemoryWall',
    tableName: 'memory_walls',
    timestamps: true,
    paranoid: false,
  }
)

export default MemoryWall
