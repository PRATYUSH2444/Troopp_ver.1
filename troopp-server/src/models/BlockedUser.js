import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class BlockedUser extends Model {}

BlockedUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    blocker_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    blocked_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'BlockedUser',
    tableName: 'blocked_users',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['blocker_id', 'blocked_id'],
      },
    ],
  }
)

export default BlockedUser
