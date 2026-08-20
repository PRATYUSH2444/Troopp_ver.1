'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'is_id_verified');
    await queryInterface.removeColumn('users', 'is_face_verified');
    await queryInterface.removeColumn('users', 'id_document_url');
    await queryInterface.removeColumn('users', 'id_metadata');
    await queryInterface.removeColumn('users', 'selfie_url');
    await queryInterface.removeColumn('users', 'verification_status');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_id_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    await queryInterface.addColumn('users', 'is_face_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    await queryInterface.addColumn('users', 'id_document_url', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'id_metadata', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'selfie_url', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'verification_status', {
      type: Sequelize.ENUM('pending', 'verified', 'failed', 'manual_review'),
      defaultValue: 'pending',
      allowNull: false
    });
  }
};
