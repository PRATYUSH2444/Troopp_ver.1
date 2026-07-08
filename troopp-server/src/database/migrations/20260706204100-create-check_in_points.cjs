'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('check_in_points', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        activity_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'activities', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        label: { type: Sequelize.STRING(150), allowNull: false },
        latitude: { type: Sequelize.DOUBLE, allowNull: false },
        longitude: { type: Sequelize.DOUBLE, allowNull: false },
        radius_meters: { type: Sequelize.INTEGER, defaultValue: 100, allowNull: false },
        scheduled_time: { type: Sequelize.DATE, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('check_in_points');
  }
};
