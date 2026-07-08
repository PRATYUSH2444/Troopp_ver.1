import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class MemoryPhoto extends Model {}

MemoryPhoto.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    memory_wall_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    uploader_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    photo_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    caption: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'MemoryPhoto',
    tableName: 'memory_photos',
    timestamps: true,
    paranoid: false,
  }
)

export default MemoryPhoto
