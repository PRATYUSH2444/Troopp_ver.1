'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('memory_photos', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        memory_wall_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'memory_walls', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        uploader_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        photo_url: { type: Sequelize.STRING(255), allowNull: false },
        caption: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('memory_photos');
  }
};
