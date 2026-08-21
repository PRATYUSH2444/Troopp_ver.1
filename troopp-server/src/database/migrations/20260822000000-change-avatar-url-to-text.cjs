'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('profiles', 'avatar_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.changeColumn('memory_photos', 'photo_url', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('profiles', 'avatar_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.changeColumn('memory_photos', 'photo_url', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  }
};
