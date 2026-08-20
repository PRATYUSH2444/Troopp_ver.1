'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create GIN full-text search indexes on boards and posts
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS boards_search_idx ON boards USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING gin(to_tsvector('english', title || ' ' || coalesce(content, '')));
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS boards_search_idx;
    `);
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS posts_search_idx;
    `);
  }
};
