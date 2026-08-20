'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('board_members', 'is_banned', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    await queryInterface.addColumn('board_members', 'ban_reason', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('board_members', 'is_banned');
    await queryInterface.removeColumn('board_members', 'ban_reason');
  }
};
