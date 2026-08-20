'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add 'draft' value to ENUM for activity status (must run outside transactional scopes if any)
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_activities_status ADD VALUE IF NOT EXISTS 'draft';
    `);

    // 2. Add columns to activities
    await queryInterface.addColumn('activities', 'hosting_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('activities', 'location_rationale', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('activities', 'host_role', {
      type: Sequelize.ENUM('creator_is_host', 'creator_assigns_host'),
      defaultValue: 'creator_is_host',
      allowNull: false
    });

    await queryInterface.addColumn('activities', 'host_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('activities', 'media', {
      type: Sequelize.JSON,
      defaultValue: [],
      allowNull: false
    });

    // 3. Backfill existing rows to preserve consistent non-null values for UI/logic
    await queryInterface.sequelize.query(`
      UPDATE activities SET 
        host_id = creator_id,
        hosting_reason = 'Community hosted trip.',
        location_rationale = 'Chosen destination for this group meetup.',
        media = '[]'::json
      WHERE host_id IS NULL OR hosting_reason IS NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('activities', 'hosting_reason');
    await queryInterface.removeColumn('activities', 'location_rationale');
    await queryInterface.removeColumn('activities', 'host_role');
    await queryInterface.removeColumn('activities', 'host_id');
    await queryInterface.removeColumn('activities', 'media');
  }
};
