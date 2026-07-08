'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        trip_room_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'trip_rooms', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        sender_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        message_text: { type: Sequelize.TEXT, allowNull: false },
        message_type: { type: Sequelize.ENUM('text', 'announcement', 'image', 'system'), defaultValue: 'text', allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('messages');
  }
};
