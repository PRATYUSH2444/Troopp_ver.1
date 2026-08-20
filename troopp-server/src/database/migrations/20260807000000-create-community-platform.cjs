'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create boards table
    await queryInterface.createTable('boards', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      creator_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      display_name: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      type: {
        type: Sequelize.ENUM('public', 'restricted', 'private'),
        defaultValue: 'public',
        allowNull: false
      },
      wiki_content: { type: Sequelize.TEXT, allowNull: true },
      rules: { type: Sequelize.JSON, defaultValue: [], allowNull: false },
      flair_options: { type: Sequelize.JSON, defaultValue: [], allowNull: false },
      avatar_url: { type: Sequelize.STRING(255), allowNull: true },
      banner_url: { type: Sequelize.STRING(255), allowNull: true },
      member_count: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. Create board_members table
    await queryInterface.createTable('board_members', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      board_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'boards', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.ENUM('member', 'moderator', 'admin'),
        defaultValue: 'member',
        allowNull: false
      },
      joined_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), allowNull: false }
    });

    // Add unique index on board_members
    await queryInterface.addIndex('board_members', ['board_id', 'user_id'], {
      unique: true,
      name: 'idx_board_members_unique'
    });

    // 3. Create posts table
    await queryInterface.createTable('posts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      board_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'boards', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: { type: Sequelize.STRING(300), allowNull: false },
      type: {
        type: Sequelize.ENUM('text', 'image', 'link', 'video', 'poll', 'trip_report'),
        defaultValue: 'text',
        allowNull: false
      },
      content: { type: Sequelize.TEXT, allowNull: true },
      media_urls: { type: Sequelize.JSON, defaultValue: [], allowNull: false },
      link_url: { type: Sequelize.STRING(1000), allowNull: true },
      trip_report_details: { type: Sequelize.JSON, allowNull: true },
      flair_id: { type: Sequelize.STRING(50), allowNull: true },
      upvotes: { type: Sequelize.INTEGER, defaultValue: 1, allowNull: false },
      downvotes: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      score: { type: Sequelize.INTEGER, defaultValue: 1, allowNull: false },
      hot_score: { type: Sequelize.DOUBLE, defaultValue: 0.0, allowNull: false },
      is_pinned: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      is_locked: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false },
      edited_at: { type: Sequelize.DATE, allowNull: true },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // Add indexes on posts for sorting
    await queryInterface.addIndex('posts', ['board_id', 'hot_score'], { name: 'idx_posts_board_hot' });
    await queryInterface.addIndex('posts', ['board_id', 'created_at'], { name: 'idx_posts_board_created' });
    await queryInterface.addIndex('posts', ['user_id', 'created_at'], { name: 'idx_posts_user_created' });

    // 4. Create comments table
    await queryInterface.createTable('comments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      post_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'posts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'comments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      content: { type: Sequelize.TEXT, allowNull: false },
      upvotes: { type: Sequelize.INTEGER, defaultValue: 1, allowNull: false },
      downvotes: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      score: { type: Sequelize.INTEGER, defaultValue: 1, allowNull: false },
      edited_at: { type: Sequelize.DATE, allowNull: true },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('comments', ['post_id', 'parent_id'], { name: 'idx_comments_post_parent' });

    // 5. Create votes table
    await queryInterface.createTable('votes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_type: { type: Sequelize.ENUM('post', 'comment'), allowNull: false },
      target_id: { type: Sequelize.UUID, allowNull: false },
      vote_value: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('votes', ['user_id', 'target_type', 'target_id'], {
      unique: true,
      name: 'idx_votes_unique_user_target'
    });

    // 6. Create poll_votes table
    await queryInterface.createTable('poll_votes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      post_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'posts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      option_id: { type: Sequelize.STRING(100), allowNull: false },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('poll_votes', ['post_id', 'user_id'], {
      unique: true,
      name: 'idx_poll_votes_unique_user'
    });

    // 7. Create saved_items table
    await queryInterface.createTable('saved_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_type: { type: Sequelize.ENUM('post', 'comment'), allowNull: false },
      target_id: { type: Sequelize.UUID, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex('saved_items', ['user_id', 'target_type', 'target_id'], {
      unique: true,
      name: 'idx_saved_items_unique'
    });

    // 8. Create community_reports table
    await queryInterface.createTable('community_reports', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      reporter_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      target_type: { type: Sequelize.ENUM('post', 'comment'), allowNull: false },
      target_id: { type: Sequelize.UUID, allowNull: false },
      reason: { type: Sequelize.STRING(255), allowNull: false },
      status: {
        type: Sequelize.ENUM('open', 'reviewed', 'actioned'),
        defaultValue: 'open',
        allowNull: false
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 9. Create mod_actions table
    await queryInterface.createTable('mod_actions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      board_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'boards', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      moderator_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      action: {
        type: Sequelize.ENUM('remove_post', 'lock_post', 'pin_post', 'ban_member', 'unban_member'),
        allowNull: false
      },
      target_id: { type: Sequelize.UUID, allowNull: false },
      reason: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('mod_actions');
    await queryInterface.dropTable('community_reports');
    await queryInterface.dropTable('saved_items');
    await queryInterface.dropTable('poll_votes');
    await queryInterface.dropTable('votes');
    await queryInterface.dropTable('comments');
    await queryInterface.dropTable('posts');
    await queryInterface.dropTable('board_members');
    await queryInterface.dropTable('boards');
  }
};
