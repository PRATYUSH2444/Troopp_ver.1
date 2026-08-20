'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Enable pg_trgm extension for similarity matching
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

    // 2. Add search_vector column to activities
    await queryInterface.addColumn('activities', 'search_vector', {
      type: Sequelize.TSVECTOR,
      allowNull: true
    });

    // 3. Populate existing rows
    await queryInterface.sequelize.query(`
      UPDATE activities SET search_vector = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(destination, ''));
    `);

    // 4. Create GIN indexes
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS activities_search_vector_idx ON activities USING gin (search_vector);
      CREATE INDEX IF NOT EXISTS activities_title_trgm_idx ON activities USING gin (title gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS activities_destination_trgm_idx ON activities USING gin (destination gin_trgm_ops);
    `);

    // 5. Create Trigger to keep tsvector updated on inserts and updates
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION activities_search_vector_trigger() RETURNS trigger AS $$
      begin
        new.search_vector := to_tsvector('english', coalesce(new.title, '') || ' ' || coalesce(new.description, '') || ' ' || coalesce(new.destination, ''));
        return new;
      end
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS tsvectorupdate ON activities;
      CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE ON activities
      FOR EACH ROW EXECUTE FUNCTION activities_search_vector_trigger();
    `);
  },

  async down(queryInterface, Sequelize) {
    // 1. Drop trigger and function
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS tsvectorupdate ON activities;');
    await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS activities_search_vector_trigger();');

    // 2. Drop indexes
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS activities_search_vector_idx;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS activities_title_trgm_idx;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS activities_destination_trgm_idx;');

    // 3. Remove column
    await queryInterface.removeColumn('activities', 'search_vector');
  }
};
