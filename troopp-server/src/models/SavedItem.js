import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class SavedItem extends Model {}

SavedItem.init(
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
    target_type: {
      type: DataTypes.ENUM('post', 'comment'),
      allowNull: false,
    },
    target_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'SavedItem',
    tableName: 'saved_items',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'target_type', 'target_id'],
      },
    ],
  }
)

export default SavedItem
