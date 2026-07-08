import { Model, DataTypes, Op } from 'sequelize'
import sequelize from '../config/db.js'

class IPBlock extends Model {
  static async isBlocked(ip) {
    const block = await this.findOne({
      where: {
        ip_address: ip,
        [Op.or]: [
          { expires_at: null },
          { expires_at: { [Op.gt]: new Date() } }
        ]
      }
    })
    return !!block
  }
}

IPBlock.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ip_address: {
      type: DataTypes.STRING(45), // Supports both IPv4 and IPv6
      allowNull: false,
      unique: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    blocked_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true, // Null means permanent block
    },
  },
  {
    sequelize,
    modelName: 'IPBlock',
    tableName: 'ip_blocks',
    timestamps: true,
    paranoid: false,
  }
)

export default IPBlock
