'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('expense_splits', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        expense_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'expenses', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        share_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        is_settled: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        settled_at: { type: Sequelize.DATE, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('expense_splits');
  }
};
