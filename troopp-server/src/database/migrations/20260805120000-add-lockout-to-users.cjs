'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'failed_login_attempts', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.addColumn('users', 'lockout_until', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'failed_login_attempts');
    await queryInterface.removeColumn('users', 'lockout_until');
  }
};
