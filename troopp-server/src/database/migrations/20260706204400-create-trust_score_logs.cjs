'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trust_score_logs', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        old_score: { type: Sequelize.INTEGER, allowNull: false },
        new_score: { type: Sequelize.INTEGER, allowNull: false },
        delta: { type: Sequelize.INTEGER, allowNull: false },
        reason: { type: Sequelize.STRING(255), allowNull: false },
        activity_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'activities', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        rater_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('trust_score_logs');
  }
};
