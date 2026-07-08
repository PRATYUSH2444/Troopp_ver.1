import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class MemberMute extends Model {
  static isMuted(activityId, userId) {
    return this.findOne({
      where: {
        activity_id: activityId,
        user_id: userId,
        muted_until: {
          [Sequelize.Op.gt]: new Date()
        }
      }
    }).then(mute => !!mute)
  }
}

MemberMute.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    muted_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    muted_until: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'MemberMute',
    tableName: 'member_mutes',
    timestamps: true,
    paranoid: false,
  }
)

export default MemberMute
