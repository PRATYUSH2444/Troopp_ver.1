import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class Post extends Model {}

Post.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    board_id: {
      type: DataTypes.UUID,
      allowNull: true, // Nullable if posted directly on a user profile
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(300),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'link', 'video', 'poll', 'trip_report'),
      defaultValue: 'text',
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    media_urls: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
    },
    link_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    trip_report_details: {
      type: DataTypes.JSON,
      allowNull: true, // { route: [], budget: 0, days: 0, difficulty: 'easy'|'moderate'|'hard' }
    },
    flair_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    upvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    downvotes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    hot_score: {
      type: DataTypes.DOUBLE,
      defaultValue: 0.0,
      allowNull: false,
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    edited_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Post',
    tableName: 'posts',
    timestamps: true,
    paranoid: true, // Enable soft-deletes (deleted_at)
  }
)

export default Post
