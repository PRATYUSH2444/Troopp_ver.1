import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class ModAction extends Model {}

ModAction.init(
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
    moderator_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM('remove_post', 'lock_post', 'pin_post', 'ban_member', 'unban_member'),
      allowNull: false,
    },
    target_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ModAction',
    tableName: 'mod_actions',
    timestamps: true,
    paranoid: false,
  }
)

export default ModAction
