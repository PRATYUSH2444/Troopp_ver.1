import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class Board extends Model {}

Board.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    creator_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9-]+$/i, // alphanumeric and hyphens only
        len: [3, 50],
      },
    },
    display_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('public', 'restricted', 'private'),
      defaultValue: 'public',
      allowNull: false,
    },
    wiki_content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rules: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
    },
    flair_options: {
      type: DataTypes.JSON,
      defaultValue: [], // Array of flairs: [{ id, text, color }]
      allowNull: false,
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    banner_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    member_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Board',
    tableName: 'boards',
    timestamps: true,
    paranoid: false,
  }
)

export default Board
