'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('profiles', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          unique: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        name: { type: Sequelize.STRING(150), allowNull: false },
        avatar_url: { type: Sequelize.STRING(255), allowNull: true },
        bio: { type: Sequelize.TEXT, allowNull: true },
        gender: { type: Sequelize.ENUM('male', 'female', 'other', 'prefer_not_to_say'), defaultValue: 'prefer_not_to_say', allowNull: false },
        trips_completed: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
        account_tenure_months: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false }
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('profiles');
  }
};
