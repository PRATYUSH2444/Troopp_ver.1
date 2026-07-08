'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activities', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        creator_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        title: { type: Sequelize.STRING(200), allowNull: false },
        type: { type: Sequelize.ENUM('trek', 'road_trip', 'cycling', 'night_drive', 'camping', 'heritage_walk', 'photography_walk', 'day_trip'), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: false },
        date_time: { type: Sequelize.DATE, allowNull: false },
        meeting_point_lat: { type: Sequelize.DOUBLE, allowNull: false },
        meeting_point_lng: { type: Sequelize.DOUBLE, allowNull: false },
        meeting_point_label: { type: Sequelize.STRING(255), allowNull: false },
        destination: { type: Sequelize.STRING(255), allowNull: false },
        city_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'cities', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        max_group_size: { type: Sequelize.INTEGER, allowNull: false },
        current_members: { type: Sequelize.INTEGER, defaultValue: 1, allowNull: false },
        cost_per_person: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false },
        difficulty_level: { type: Sequelize.ENUM('easy', 'moderate', 'hard', 'expert'), defaultValue: 'easy', allowNull: false },
        packing_checklist: { type: Sequelize.JSON, allowNull: true },
        visibility: { type: Sequelize.ENUM('open', 'followers_only'), defaultValue: 'open', allowNull: false },
        is_women_only: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        min_trust_score: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
        min_reliability_score: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
        vibe_score_tag: { type: Sequelize.STRING(100), allowNull: true },
        status: { type: Sequelize.ENUM('open', 'full', 'closed', 'cancelled', 'completed'), defaultValue: 'open', allowNull: false },
        auto_close_at: { type: Sequelize.DATE, allowNull: true },
        rating_prompt_sent: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        rating_window_closed: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activities');
  }
};
