import { Model, DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

class Activity extends Model {
  static findUpcoming() {
    return this.findAll({
      where: {
        status: 'open',
        date_time: {
          [Sequelize.Op.gt]: new Date()
        }
      }
    })
  }
}

Activity.init(
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [5, 200],
      },
    },
    type: {
      type: DataTypes.ENUM(
        'trek',
        'road_trip',
        'cycling',
        'night_drive',
        'camping',
        'heritage_walk',
        'photography_walk',
        'day_trip'
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 2000],
      },
    },
    date_time: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterNow(value) {
          if (new Date(value) <= new Date()) {
            throw new Error('Activity date and time must be in the future.')
          }
        }
      }
    },
    meeting_point_lat: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        min: -90,
        max: 90,
      },
    },
    meeting_point_lng: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        min: -180,
        max: 180,
      },
    },
    meeting_point_label: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    destination: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    max_group_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2,
        max: 100,
      },
    },
    current_members: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    cost_per_person: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    difficulty_level: {
      type: DataTypes.ENUM('easy', 'moderate', 'hard', 'expert'),
      allowNull: false,
      defaultValue: 'easy',
    },
    packing_checklist: {
      type: DataTypes.JSON,
      allowNull: true, // List of item objects: [{ item: 'water', qty: '1L', assigned_to: null, checked: false }]
    },
    visibility: {
      type: DataTypes.ENUM('open', 'followers_only'),
      defaultValue: 'open',
      allowNull: false,
    },
    is_women_only: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    min_trust_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    min_reliability_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    vibe_score_tag: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('open', 'full', 'closed', 'cancelled', 'completed'),
      defaultValue: 'open',
      allowNull: false,
    },
    auto_close_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rating_prompt_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    rating_window_closed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Activity',
    tableName: 'activities',
    timestamps: true,
    paranoid: true,
  }
)

export default Activity
