import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class Settlement extends Model {}

Settlement.init(
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
    payer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    payee_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending', // pending | processing | success | failed | cancelled | refunded
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: true, // upi | card | wallet | cash
    },
    provider: {
      type: DataTypes.STRING(20),
      allowNull: true, // razorpay
    },
    provider_order_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    provider_payment_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    idempotency_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    settled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Settlement',
    tableName: 'settlements',
    timestamps: true,
    paranoid: false,
    underscored: true,
  }
)

export default Settlement
