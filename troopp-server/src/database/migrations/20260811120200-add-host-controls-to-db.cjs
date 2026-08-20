'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add min_reveal_count column to activities
    await queryInterface.addColumn('activities', 'min_reveal_count', {
      type: Sequelize.INTEGER,
      defaultValue: 3,
      allowNull: false
    });

    // 2. Add urgency_badges_enabled column to activities
    await queryInterface.addColumn('activities', 'urgency_badges_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });

    // 3. Add online_status_visible column to users
    await queryInterface.addColumn('users', 'online_status_visible', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('activities', 'min_reveal_count');
    await queryInterface.removeColumn('activities', 'urgency_badges_enabled');
    await queryInterface.removeColumn('users', 'online_status_visible');
  }
};
