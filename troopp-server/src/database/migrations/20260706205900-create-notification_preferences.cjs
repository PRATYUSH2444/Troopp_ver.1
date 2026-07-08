'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notification_preferences', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          unique: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        new_activities: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
        trip_updates: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
        join_updates: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
        score_changes: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
        social: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
        safety: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
        admin_broadcasts: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notification_preferences');
  }
};
