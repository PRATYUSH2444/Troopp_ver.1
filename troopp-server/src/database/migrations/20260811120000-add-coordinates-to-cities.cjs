'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add latitude and longitude columns
    await queryInterface.addColumn('cities', 'latitude', {
      type: Sequelize.DOUBLE,
      allowNull: true
    });

    await queryInterface.addColumn('cities', 'longitude', {
      type: Sequelize.DOUBLE,
      allowNull: true
    });

    // 2. Backfill coordinates for seeded cities
    // Bengaluru (default fallback), Mumbai, Delhi, Pune, Chennai
    await queryInterface.sequelize.query(`
      UPDATE cities SET latitude = 19.0760, longitude = 72.8777 WHERE LOWER(city_name) LIKE '%mumbai%';
      UPDATE cities SET latitude = 12.9716, longitude = 77.5946 WHERE LOWER(city_name) LIKE '%bengaluru%' OR LOWER(city_name) LIKE '%bangalore%';
      UPDATE cities SET latitude = 28.7041, longitude = 77.1025 WHERE LOWER(city_name) LIKE '%delhi%';
      UPDATE cities SET latitude = 18.5204, longitude = 73.8567 WHERE LOWER(city_name) LIKE '%pune%';
      UPDATE cities SET latitude = 13.0827, longitude = 80.2707 WHERE LOWER(city_name) LIKE '%chennai%';
      
      -- Default fallback coordinates for any other cities to Bengaluru
      UPDATE cities SET latitude = 12.9716, longitude = 77.5946 WHERE latitude IS NULL;
    `);

    // 3. Make them NOT NULL after backfilling
    await queryInterface.changeColumn('cities', 'latitude', {
      type: Sequelize.DOUBLE,
      allowNull: false
    });

    await queryInterface.changeColumn('cities', 'longitude', {
      type: Sequelize.DOUBLE,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('cities', 'latitude');
    await queryInterface.removeColumn('cities', 'longitude');
  }
};
