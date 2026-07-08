'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('activity_members', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'pending',
      allowNull: false
    });
    await queryInterface.addColumn('activity_members', 'role', {
      type: Sequelize.STRING,
      defaultValue: 'member',
      allowNull: false
    });
    await queryInterface.addColumn('activity_members', 'position', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.addColumn('activity_members', 'no_show_checked', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('activity_members', 'status');
    await queryInterface.removeColumn('activity_members', 'role');
    await queryInterface.removeColumn('activity_members', 'position');
    await queryInterface.removeColumn('activity_members', 'no_show_checked');
  }
};
