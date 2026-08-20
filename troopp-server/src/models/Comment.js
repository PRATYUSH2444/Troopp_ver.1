import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class Comment extends Model {}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    post_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true, // Nullable for top-level comments
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
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
    modelName: 'Comment',
    tableName: 'comments',
    timestamps: true,
    paranoid: true, // Enable soft-deletes for comments
  }
)

export default Comment
