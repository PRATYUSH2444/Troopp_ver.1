'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trip_rules', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        activity_id: {
          type: Sequelize.UUID,
          allowNull: false,
          unique: true,
          references: { model: 'activities', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        language: { type: Sequelize.ENUM('hindi', 'english', 'both'), defaultValue: 'english', allowNull: false },
        members_can_add_expenses: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
        members_can_create_polls: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
        chat_before_full: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
        moderated_mode: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        phone_sharing_enabled: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        checkin_required: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        safety_briefing_text: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('trip_rules');
  }
};
