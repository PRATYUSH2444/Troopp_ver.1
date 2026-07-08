'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        phone: { type: Sequelize.STRING(20), allowNull: true, unique: true },
        password_hash: { type: Sequelize.STRING(255), allowNull: true },
        google_id: { type: Sequelize.STRING(255), allowNull: true, unique: true },
        is_phone_verified: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        is_id_verified: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        is_face_verified: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        id_document_url: { type: Sequelize.STRING(255), allowNull: true },
        id_metadata: { type: Sequelize.TEXT, allowNull: true },
        selfie_url: { type: Sequelize.STRING(255), allowNull: true },
        verification_status: { type: Sequelize.ENUM('pending', 'verified', 'failed', 'manual_review'), defaultValue: 'pending', allowNull: false },
        role: { type: Sequelize.ENUM('member', 'admin'), defaultValue: 'member', allowNull: false },
        trust_score: { type: Sequelize.INTEGER, defaultValue: 50, allowNull: false },
        reliability_score: { type: Sequelize.INTEGER, defaultValue: 100, allowNull: false },
        score_frozen: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        account_status: { type: Sequelize.ENUM('active', 'suspended', 'deactivated', 'banned'), defaultValue: 'active', allowNull: false },
        ban_reason: { type: Sequelize.TEXT, allowNull: true },
        suspension_until: { type: Sequelize.DATE, allowNull: true },
        onboarding_completed: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        interest_tags: { type: Sequelize.JSON, allowNull: true },
        tos_accepted_at: { type: Sequelize.DATE, allowNull: true },
        city_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'cities', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
