'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cities', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        city_name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        state: { type: Sequelize.STRING(100), allowNull: false },
        is_active: { type: Sequelize.BOOLEAN, defaultValue: true, allowNull: false },
        launch_date: { type: Sequelize.DATE, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cities');
  }
};
