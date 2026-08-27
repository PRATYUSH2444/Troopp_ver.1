'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create settlements table
    await queryInterface.createTable('settlements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      activity_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'activities', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      payer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      payee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending', // pending | processing | success | failed | cancelled | refunded
      },
      payment_method: {
        type: Sequelize.STRING(20),
        allowNull: true, // upi | card | wallet | cash
      },
      provider: {
        type: Sequelize.STRING(20),
        allowNull: true, // razorpay
      },
      provider_order_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      provider_payment_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      idempotency_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      settled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('settlements', ['activity_id'], {
      name: 'idx_settlements_activity',
    });
    await queryInterface.addIndex('settlements', ['idempotency_key'], {
      unique: true,
      name: 'idx_settlements_idempotency',
    });

    // 2. Create expense_payers table (for multi-payer support)
    await queryInterface.createTable('expense_payers', {
      expense_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'expenses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount_paid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('expense_payers');
    await queryInterface.dropTable('settlements');
  },
};
