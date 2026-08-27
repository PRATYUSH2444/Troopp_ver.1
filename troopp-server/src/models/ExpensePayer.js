import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class ExpensePayer extends Model {}

ExpensePayer.init(
  {
    expense_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    amount_paid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
  },
  {
    sequelize,
    modelName: 'ExpensePayer',
    tableName: 'expense_payers',
    timestamps: true,
    paranoid: false,
    underscored: true,
  }
)

export default ExpensePayer
