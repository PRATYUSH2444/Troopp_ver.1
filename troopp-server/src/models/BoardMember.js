import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class BoardMember extends Model {}

BoardMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    board_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('member', 'moderator', 'admin'),
      defaultValue: 'member',
      allowNull: false,
    },
    is_banned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    ban_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'BoardMember',
    tableName: 'board_members',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['board_id', 'user_id'],
      },
    ],
  }
)

export default BoardMember
