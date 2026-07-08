import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class ExpenseSplit extends Model {}

ExpenseSplit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    expense_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    share_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.00,
      },
    },
    is_settled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    settled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ExpenseSplit',
    tableName: 'expense_splits',
    timestamps: true,
    paranoid: false,
  }
)

export default ExpenseSplit
