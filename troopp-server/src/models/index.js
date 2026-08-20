import sequelize from '../config/db.js'
import City from './City.js'
import User from './User.js'
import Profile from './Profile.js'
import EmergencyContact from './EmergencyContact.js'
import Activity from './Activity.js'
import ActivityMember from './ActivityMember.js'
import TripRoom from './TripRoom.js'
import Message from './Message.js'
import Expense from './Expense.js'
import ExpenseSplit from './ExpenseSplit.js'
import Poll from './Poll.js'
import CheckInPoint from './CheckInPoint.js'
import CheckInLog from './CheckInLog.js'
import Rating from './Rating.js'
import TrustScoreLog from './TrustScoreLog.js'
import ReliabilityScoreLog from './ReliabilityScoreLog.js'
import Report from './Report.js'
import Notification from './Notification.js'
import MemoryWall from './MemoryWall.js'
import MemoryPhoto from './MemoryPhoto.js'
import Follow from './Follow.js'
import AdminLog from './AdminLog.js'
import TripRule from './TripRule.js'
import TripWelcomeMessage from './TripWelcomeMessage.js'
import HostAction from './HostAction.js'
import MemberMute from './MemberMute.js'
import JoinerOnboardingStatus from './JoinerOnboardingStatus.js'
import TripAttendance from './TripAttendance.js'
import UserFCMToken from './UserFCMToken.js'
import NotificationPreference from './NotificationPreference.js'
import TokenBlacklist from './TokenBlacklist.js'
import IPBlock from './IPBlock.js'
import ActivityReport from './ActivityReport.js'
import UserTOSAcceptance from './UserTOSAcceptance.js'
import BlockedUser from './BlockedUser.js'
import Board from './Board.js'
import BoardMember from './BoardMember.js'
import Post from './Post.js'
import Comment from './Comment.js'
import Vote from './Vote.js'
import PollVote from './PollVote.js'
import SavedItem from './SavedItem.js'
import CommunityReport from './CommunityReport.js'
import ModAction from './ModAction.js'

// ==============================================================================
// DEFINE ALL 35 MODEL ASSOCIATIONS
// ==============================================================================

// 1. User & Profile
User.hasOne(Profile, { foreignKey: 'user_id', onDelete: 'CASCADE' })
Profile.belongsTo(User, { foreignKey: 'user_id' })

// 2. User & EmergencyContact
User.hasMany(EmergencyContact, { foreignKey: 'user_id', as: 'EmergencyContacts', onDelete: 'CASCADE' })
User.hasOne(EmergencyContact, { foreignKey: 'user_id', as: 'EmergencyContact', onDelete: 'CASCADE' })
EmergencyContact.belongsTo(User, { foreignKey: 'user_id' })

// 3. User & NotificationPreference
User.hasOne(NotificationPreference, { foreignKey: 'user_id', onDelete: 'CASCADE' })
NotificationPreference.belongsTo(User, { foreignKey: 'user_id' })

// 4. City, User & Activity
City.hasMany(User, { foreignKey: 'city_id' })
User.belongsTo(City, { foreignKey: 'city_id' })

City.hasMany(Activity, { foreignKey: 'city_id' })
Activity.belongsTo(City, { foreignKey: 'city_id' })

User.hasMany(Activity, { foreignKey: 'creator_id', as: 'CreatedActivities' })
Activity.belongsTo(User, { foreignKey: 'creator_id', as: 'Creator' })
Activity.belongsTo(User, { foreignKey: 'host_id', as: 'Host' })

// 5. Activity & ActivityMember
Activity.hasMany(ActivityMember, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
ActivityMember.belongsTo(Activity, { foreignKey: 'activity_id' })

User.hasMany(ActivityMember, { foreignKey: 'user_id', onDelete: 'CASCADE' })
ActivityMember.belongsTo(User, { foreignKey: 'user_id' })

// 6. Activity & TripRoom & Messages
Activity.hasOne(TripRoom, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
TripRoom.belongsTo(Activity, { foreignKey: 'activity_id' })

TripRoom.hasMany(Message, { foreignKey: 'trip_room_id', onDelete: 'CASCADE' })
Message.belongsTo(TripRoom, { foreignKey: 'trip_room_id' })

User.hasMany(Message, { foreignKey: 'sender_id' })
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' })

// 7. Activity & Expenses & Splits
Activity.hasMany(Expense, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
Expense.belongsTo(Activity, { foreignKey: 'activity_id' })

User.hasMany(Expense, { foreignKey: 'payer_id' })
Expense.belongsTo(User, { foreignKey: 'payer_id', as: 'Payer' })

Expense.hasMany(ExpenseSplit, { foreignKey: 'expense_id', as: 'Splits', onDelete: 'CASCADE' })
ExpenseSplit.belongsTo(Expense, { foreignKey: 'expense_id' })

User.hasMany(ExpenseSplit, { foreignKey: 'user_id', onDelete: 'CASCADE' })
ExpenseSplit.belongsTo(User, { foreignKey: 'user_id' })

// 8. Activity & Polls
Activity.hasMany(Poll, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
Poll.belongsTo(Activity, { foreignKey: 'activity_id' })

User.hasMany(Poll, { foreignKey: 'creator_id' })
Poll.belongsTo(User, { foreignKey: 'creator_id', as: 'Creator' })

// 9. Activity & CheckInPoints & Logs
Activity.hasMany(CheckInPoint, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
CheckInPoint.belongsTo(Activity, { foreignKey: 'activity_id' })

CheckInPoint.hasMany(CheckInLog, { foreignKey: 'check_in_point_id', onDelete: 'CASCADE' })
CheckInLog.belongsTo(CheckInPoint, { foreignKey: 'check_in_point_id' })

User.hasMany(CheckInLog, { foreignKey: 'user_id', onDelete: 'CASCADE' })
CheckInLog.belongsTo(User, { foreignKey: 'user_id' })

// 10. Ratings
Activity.hasMany(Rating, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
Rating.belongsTo(Activity, { foreignKey: 'activity_id' })

User.hasMany(Rating, { foreignKey: 'rater_id', as: 'SubmittedRatings' })
Rating.belongsTo(User, { foreignKey: 'rater_id', as: 'Rater' })

User.hasMany(Rating, { foreignKey: 'ratee_id', as: 'ReceivedRatings' })
Rating.belongsTo(User, { foreignKey: 'ratee_id', as: 'Ratee' })

// 11. Trust and Reliability Logs
User.hasMany(TrustScoreLog, { foreignKey: 'user_id', onDelete: 'CASCADE' })
TrustScoreLog.belongsTo(User, { foreignKey: 'user_id' })

User.hasMany(TrustScoreLog, { foreignKey: 'rater_id' })
TrustScoreLog.belongsTo(User, { foreignKey: 'rater_id', as: 'Rater' })

Activity.hasMany(TrustScoreLog, { foreignKey: 'activity_id' })
TrustScoreLog.belongsTo(Activity, { foreignKey: 'activity_id' })

User.hasMany(ReliabilityScoreLog, { foreignKey: 'user_id', onDelete: 'CASCADE' })
ReliabilityScoreLog.belongsTo(User, { foreignKey: 'user_id' })

Activity.hasMany(ReliabilityScoreLog, { foreignKey: 'activity_id' })
ReliabilityScoreLog.belongsTo(Activity, { foreignKey: 'activity_id' })

// 12. User Reports
User.hasMany(Report, { foreignKey: 'reporter_id', as: 'FiledReports' })
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'Reporter' })

User.hasMany(Report, { foreignKey: 'reported_user_id', as: 'ReceivedReports' })
Report.belongsTo(User, { foreignKey: 'reported_user_id', as: 'ReportedUser' })

Activity.hasMany(Report, { foreignKey: 'activity_id' })
Report.belongsTo(Activity, { foreignKey: 'activity_id' })

// 13. Notifications
User.hasMany(Notification, { foreignKey: 'user_id', onDelete: 'CASCADE' })
Notification.belongsTo(User, { foreignKey: 'user_id' })

// 14. Activity Memory Wall & Photos
Activity.hasOne(MemoryWall, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
MemoryWall.belongsTo(Activity, { foreignKey: 'activity_id' })

MemoryWall.hasMany(MemoryPhoto, { foreignKey: 'memory_wall_id', onDelete: 'CASCADE' })
MemoryPhoto.belongsTo(MemoryWall, { foreignKey: 'memory_wall_id' })

User.hasMany(MemoryPhoto, { foreignKey: 'uploader_id' })
MemoryPhoto.belongsTo(User, { foreignKey: 'uploader_id', as: 'Uploader' })

// 15. Follows
User.hasMany(Follow, { foreignKey: 'follower_id', as: 'FollowingList' })
Follow.belongsTo(User, { foreignKey: 'follower_id', as: 'Follower' })

User.hasMany(Follow, { foreignKey: 'following_id', as: 'FollowersList' })
Follow.belongsTo(User, { foreignKey: 'following_id', as: 'Following' })

// 16. Admin Logs
User.hasMany(AdminLog, { foreignKey: 'admin_id' })
AdminLog.belongsTo(User, { foreignKey: 'admin_id', as: 'Admin' })

// 17. Host Controls Rules & Welcomes
Activity.hasOne(TripRule, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
TripRule.belongsTo(Activity, { foreignKey: 'activity_id' })

Activity.hasOne(TripWelcomeMessage, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
TripWelcomeMessage.belongsTo(Activity, { foreignKey: 'activity_id' })

// 18. Host actions, mutes & onboarding
Activity.hasMany(HostAction, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
HostAction.belongsTo(Activity, { foreignKey: 'activity_id' })

User.hasMany(HostAction, { foreignKey: 'host_id', as: 'HostModerations' })
HostAction.belongsTo(User, { foreignKey: 'host_id', as: 'Host' })

User.hasMany(HostAction, { foreignKey: 'target_user_id', as: 'TargetModerations' })
HostAction.belongsTo(User, { foreignKey: 'target_user_id', as: 'Target' })

Activity.hasMany(MemberMute, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
MemberMute.belongsTo(Activity, { foreignKey: 'activity_id' })

User.hasMany(MemberMute, { foreignKey: 'user_id', onDelete: 'CASCADE' })
MemberMute.belongsTo(User, { foreignKey: 'user_id' })

User.hasMany(MemberMute, { foreignKey: 'muted_by' })
MemberMute.belongsTo(User, { foreignKey: 'muted_by', as: 'Muter' })

Activity.hasMany(JoinerOnboardingStatus, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
JoinerOnboardingStatus.belongsTo(Activity, { foreignKey: 'activity_id' })

User.hasMany(JoinerOnboardingStatus, { foreignKey: 'user_id', onDelete: 'CASCADE' })
JoinerOnboardingStatus.belongsTo(User, { foreignKey: 'user_id' })

// 19. Trip Attendance
Activity.hasMany(TripAttendance, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
TripAttendance.belongsTo(Activity, { foreignKey: 'activity_id' })

User.hasMany(TripAttendance, { foreignKey: 'user_id', onDelete: 'CASCADE' })
TripAttendance.belongsTo(User, { foreignKey: 'user_id' })

// 20. FCM & Tokens
User.hasMany(UserFCMToken, { foreignKey: 'user_id', onDelete: 'CASCADE' })
UserFCMToken.belongsTo(User, { foreignKey: 'user_id' })

User.hasMany(TokenBlacklist, { foreignKey: 'user_id', onDelete: 'CASCADE' })
TokenBlacklist.belongsTo(User, { foreignKey: 'user_id' })

// 21. IP Blocks
User.hasMany(IPBlock, { foreignKey: 'blocked_by' })
IPBlock.belongsTo(User, { foreignKey: 'blocked_by', as: 'AdminBlocker' })

// 22. Activity Reports
Activity.hasMany(ActivityReport, { foreignKey: 'activity_id', onDelete: 'CASCADE' })
ActivityReport.belongsTo(Activity, { foreignKey: 'activity_id' })

User.hasMany(ActivityReport, { foreignKey: 'reporter_id' })
ActivityReport.belongsTo(User, { foreignKey: 'reporter_id', as: 'Reporter' })

// 23. TOS Acceptance
User.hasMany(UserTOSAcceptance, { foreignKey: 'user_id', onDelete: 'CASCADE' })
UserTOSAcceptance.belongsTo(User, { foreignKey: 'user_id' })

// 24. Blocked Users
User.hasMany(BlockedUser, { foreignKey: 'blocker_id', as: 'BlockingList', onDelete: 'CASCADE' })
BlockedUser.belongsTo(User, { foreignKey: 'blocker_id', as: 'Blocker' })

User.hasMany(BlockedUser, { foreignKey: 'blocked_id', as: 'BlockedList', onDelete: 'CASCADE' })
BlockedUser.belongsTo(User, { foreignKey: 'blocked_id', as: 'BlockedUser' })

// ==============================================================================
// TRAVEL BOARDS / REDDIT COMMUNITY ASSOCIATIONS
// ==============================================================================

// 1. Board & Creator
User.hasMany(Board, { foreignKey: 'creator_id', as: 'CreatedBoards' })
Board.belongsTo(User, { foreignKey: 'creator_id', as: 'Creator' })

// 2. Board & BoardMember & User
Board.hasMany(BoardMember, { foreignKey: 'board_id', onDelete: 'CASCADE' })
BoardMember.belongsTo(Board, { foreignKey: 'board_id' })
User.hasMany(BoardMember, { foreignKey: 'user_id', onDelete: 'CASCADE' })
BoardMember.belongsTo(User, { foreignKey: 'user_id' })

// 3. Board & Post & User
Board.hasMany(Post, { foreignKey: 'board_id', onDelete: 'CASCADE' })
Post.belongsTo(Board, { foreignKey: 'board_id' })
User.hasMany(Post, { foreignKey: 'user_id', onDelete: 'CASCADE' })
Post.belongsTo(User, { foreignKey: 'user_id' })

// 4. Post & Comment & User
Post.hasMany(Comment, { foreignKey: 'post_id', onDelete: 'CASCADE' })
Comment.belongsTo(Post, { foreignKey: 'post_id' })
User.hasMany(Comment, { foreignKey: 'user_id', onDelete: 'CASCADE' })
Comment.belongsTo(User, { foreignKey: 'user_id' })

// 5. Nested Comments (Replies)
Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'Replies', onDelete: 'CASCADE' })
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'Parent' })

// 6. User & Vote
User.hasMany(Vote, { foreignKey: 'user_id', onDelete: 'CASCADE' })
Vote.belongsTo(User, { foreignKey: 'user_id' })

// 7. PollVote
Post.hasMany(PollVote, { foreignKey: 'post_id', onDelete: 'CASCADE' })
PollVote.belongsTo(Post, { foreignKey: 'post_id' })
User.hasMany(PollVote, { foreignKey: 'user_id', onDelete: 'CASCADE' })
PollVote.belongsTo(User, { foreignKey: 'user_id' })

// 8. SavedItem
User.hasMany(SavedItem, { foreignKey: 'user_id', onDelete: 'CASCADE' })
SavedItem.belongsTo(User, { foreignKey: 'user_id' })

// 9. CommunityReport
User.hasMany(CommunityReport, { foreignKey: 'reporter_id', as: 'FiledCommunityReports', onDelete: 'CASCADE' })
CommunityReport.belongsTo(User, { foreignKey: 'reporter_id', as: 'Reporter' })

// 10. ModAction
Board.hasMany(ModAction, { foreignKey: 'board_id', onDelete: 'CASCADE' })
ModAction.belongsTo(Board, { foreignKey: 'board_id' })
User.hasMany(ModAction, { foreignKey: 'moderator_id', onDelete: 'CASCADE' })
ModAction.belongsTo(User, { foreignKey: 'moderator_id', as: 'Moderator' })

// ==============================================================================
// EXPORT ALL MODELS
// ==============================================================================
export {
  sequelize,
  City,
  User,
  Profile,
  EmergencyContact,
  Activity,
  ActivityMember,
  TripRoom,
  Message,
  Expense,
  ExpenseSplit,
  Poll,
  CheckInPoint,
  CheckInLog,
  Rating,
  TrustScoreLog,
  ReliabilityScoreLog,
  Report,
  Notification,
  MemoryWall,
  MemoryPhoto,
  Follow,
  AdminLog,
  TripRule,
  TripWelcomeMessage,
  HostAction,
  MemberMute,
  JoinerOnboardingStatus,
  TripAttendance,
  UserFCMToken,
  NotificationPreference,
  TokenBlacklist,
  IPBlock,
  ActivityReport,
  UserTOSAcceptance,
  BlockedUser,
  Board,
  BoardMember,
  Post,
  Comment,
  Vote,
  PollVote,
  SavedItem,
  CommunityReport,
  ModAction
}
