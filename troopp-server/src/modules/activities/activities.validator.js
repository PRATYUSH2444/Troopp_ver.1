import Joi from 'joi'

// 1. Create Activity Request Schema
export const createActivitySchema = Joi.object({
  title: Joi.string().min(5).max(100).required().messages({
    'string.min': 'Title must be at least 5 characters long.',
    'string.max': 'Title cannot exceed 100 characters.'
  }),
  type: Joi.string().valid('trek', 'road_trip', 'cycling', 'night_drive', 'camping', 'heritage_walk', 'photography_walk', 'day_trip').required(),
  description: Joi.string().min(10).max(2000).required(),
  date_time: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'Activity date and time must be in the future.'
  }),
  meeting_point_lat: Joi.number().min(-90).max(90).required(),
  meeting_point_lng: Joi.number().min(-180).max(180).required(),
  meeting_point_label: Joi.string().max(255).required(),
  destination: Joi.string().max(255).required(),
  city_id: Joi.string().uuid().required(),
  max_group_size: Joi.number().integer().min(2).max(100).required(),
  cost_per_person: Joi.number().min(0).precision(2).default(0.00),
  difficulty_level: Joi.string().valid('easy', 'moderate', 'hard', 'expert').default('easy'),
  packing_checklist: Joi.array().items(
    Joi.object({
      item: Joi.string().required(),
      qty: Joi.string().default('1'),
      checked: Joi.boolean().default(false)
    })
  ).optional(),
  visibility: Joi.string().valid('open', 'followers_only').default('open'),
  is_women_only: Joi.boolean().default(false),
  min_trust_score: Joi.number().integer().min(0).max(100).default(0),
  min_reliability_score: Joi.number().integer().min(0).max(100).default(0)
})

// 2. Update Activity Request Schema
export const updateActivitySchema = Joi.object({
  title: Joi.string().min(5).max(100).optional(),
  description: Joi.string().min(10).max(2000).optional(),
  date_time: Joi.date().iso().greater('now').optional(),
  meeting_point_lat: Joi.number().min(-90).max(90).optional(),
  meeting_point_lng: Joi.number().min(-180).max(180).optional(),
  meeting_point_label: Joi.string().max(255).optional(),
  destination: Joi.string().max(255).optional(),
  max_group_size: Joi.number().integer().min(2).max(100).optional(),
  cost_per_person: Joi.number().min(0).precision(2).optional(),
  difficulty_level: Joi.string().valid('easy', 'moderate', 'hard', 'expert').optional(),
  packing_checklist: Joi.array().items(
    Joi.object({
      item: Joi.string().required(),
      qty: Joi.string().default('1'),
      checked: Joi.boolean().default(false)
    })
  ).optional()
})

// 3. Join Request Intent Schema
export const joinActivitySchema = Joi.object({
  message: Joi.string().max(300).optional(),
  intent: Joi.string().valid('request', 'confirm').default('request')
})

// 4. Setup Group Rules Schema
export const setupRulesSchema = Joi.object({
  language: Joi.string().valid('hindi', 'english', 'both').default('english'),
  members_can_add_expenses: Joi.boolean().default(true),
  members_can_create_polls: Joi.boolean().default(true),
  chat_before_full: Joi.boolean().default(true),
  moderated_mode: Joi.boolean().default(false),
  phone_sharing_enabled: Joi.boolean().default(false),
  checkin_required: Joi.boolean().default(false),
  safety_briefing_text: Joi.string().max(1000).allow('', null).optional()
})

// 5. Welcome Message Schema
export const welcomeMessageSchema = Joi.object({
  message_text: Joi.string().max(500).required()
})

// 6. Waypoints Schema
export const waypointsSchema = Joi.object({
  waypoints: Joi.array().items(
    Joi.object({
      label: Joi.string().max(150).required(),
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      radius_meters: Joi.number().integer().min(10).max(500).default(100),
      scheduled_time: Joi.date().iso().optional()
    })
  ).required()
})
