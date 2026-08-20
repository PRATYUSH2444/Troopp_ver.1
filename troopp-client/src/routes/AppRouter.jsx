import React, { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

// Layouts and HOC guards
import AppLayout from '../components/layout/AppLayout.jsx'
import AdminLayout from '../components/layout/AdminLayout.jsx'
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from '../components/auth/ProtectedRoutes.jsx'
import Spinner from '../components/common/Spinner.jsx'

// Helper component to scroll window to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// ============================================================================
// LAZY-LOAD PAGE COMPONENTS
// ============================================================================

// Public Pages
const Landing = lazy(() => import('../pages/Landing.jsx'))
const Login = lazy(() => import('../pages/Login.jsx'))
const Signup = lazy(() => import('../pages/Signup.jsx'))
const VerifyEmail = lazy(() => import('../pages/VerifyEmail.jsx'))
const VerifyPhone = lazy(() => import('../pages/VerifyPhone.jsx'))
const VerifyPhoneCheck = lazy(() => import('../pages/VerifyPhoneCheck.jsx'))
const CompleteSignup = lazy(() => import('../pages/CompleteSignup.jsx'))
const GoogleCallback = lazy(() => import('../pages/GoogleCallback.jsx'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('../pages/ResetPassword.jsx'))
const ShareActivity = lazy(() => import('../pages/ShareActivity.jsx'))
const Terms = lazy(() => import('../pages/Terms.jsx'))
const Privacy = lazy(() => import('../pages/Privacy.jsx'))
const NotFound = lazy(() => import('../pages/NotFound.jsx'))
const Maintenance = lazy(() => import('../pages/Maintenance.jsx'))

// Protected App Pages
const Onboarding = lazy(() => import('../pages/Onboarding.jsx'))
import Feed from '../pages/Feed.jsx'
const Search = lazy(() => import('../pages/Search.jsx'))
const ActivityDetail = lazy(() => import('../pages/ActivityDetail.jsx'))
const CreateActivity = lazy(() => import('../pages/CreateActivity.jsx'))
const EditActivity = lazy(() => import('../pages/EditActivity.jsx'))
const SetupActivity = lazy(() => import('../pages/SetupActivity.jsx'))
const MyProfile = lazy(() => import('../pages/MyProfile.jsx'))
const EditProfile = lazy(() => import('../pages/EditProfile.jsx'))
const EmergencyContacts = lazy(() => import('../pages/EmergencyContacts.jsx'))
const Settings = lazy(() => import('../pages/Settings.jsx'))
const NotificationSettings = lazy(() => import('../pages/NotificationSettings.jsx'))
const UserProfile = lazy(() => import('../pages/UserProfile.jsx'))
const TripRoom = lazy(() => import('../pages/TripRoom.jsx'))
const Notifications = lazy(() => import('../pages/Notifications.jsx'))
const JoinRequestsPage = lazy(() => import('../pages/activities/JoinRequestsPage.jsx'))
const RatingPage = lazy(() => import('../pages/rating/RatingPage.jsx'))
const MemoryWallDetailPage = lazy(() => import('../pages/memory/MemoryWallDetailPage.jsx'))
const NotificationPreferencesPage = lazy(() => import('../pages/settings/NotificationPreferencesPage.jsx'))
const FollowersListPage = lazy(() => import('../pages/social/FollowersListPage.jsx'))
const FollowingListPage = lazy(() => import('../pages/social/FollowingListPage.jsx'))
const Suspended = lazy(() => import('../pages/Suspended.jsx'))
const Banned = lazy(() => import('../pages/Banned.jsx'))
const Offline = lazy(() => import('../pages/Offline.jsx'))

// Community Pages
const CommunityFeed = lazy(() => import('../pages/community/CommunityFeed.jsx'))
const BoardFeed = lazy(() => import('../pages/community/BoardFeed.jsx'))
const PostDetail = lazy(() => import('../pages/community/PostDetail.jsx'))
const SubmitPost = lazy(() => import('../pages/community/SubmitPost.jsx'))
const CreateBoard = lazy(() => import('../pages/community/CreateBoard.jsx'))
const ModQueue = lazy(() => import('../pages/community/ModQueue.jsx'))

// Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard.jsx'))
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers.jsx'))
const AdminUserDetail = lazy(() => import('../pages/admin/AdminUserDetail.jsx'))
const AdminReports = lazy(() => import('../pages/admin/AdminReports.jsx'))
const AdminActivityReports = lazy(() => import('../pages/admin/AdminActivityReports.jsx'))
const AdminActivities = lazy(() => import('../pages/admin/AdminActivities.jsx'))
const AdminAnalytics = lazy(() => import('../pages/admin/AdminAnalytics.jsx'))
const AdminBroadcast = lazy(() => import('../pages/admin/AdminBroadcast.jsx'))
const AdminIPBlocks = lazy(() => import('../pages/admin/AdminIPBlocks.jsx'))
const AdminLogs = lazy(() => import('../pages/admin/AdminLogs.jsx'))
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings.jsx'))

// Loading Fallback Component
const LoaderFallback = () => (
  <div className="w-full min-h-[60vh] flex items-center justify-center">
    <Spinner size="lg" />
  </div>
)

const AppRouter = () => {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoaderFallback />}>
        <Routes>
          {/* ==========================================================================
              1. PUBLIC ONLY ROUTES (Authentication block)
              ========================================================================== */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signup/verify-email" element={<VerifyEmail />} />
            <Route path="/signup/verify-phone" element={<VerifyPhone />} />
            <Route path="/signup/verify-phone/check" element={<VerifyPhoneCheck />} />
            <Route path="/signup/complete" element={<CompleteSignup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Social login redirects */}
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          
          {/* Static Public Routes */}
          <Route path="/activities/:id/share" element={<ShareActivity />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/offline" element={<Offline />} />

          {/* Public Community Feed & Boards (wrapped in sidebar/navbar shell but accessible to guests) */}
          <Route element={<AppLayout />}>
            <Route path="/community" element={<CommunityFeed />} />
            <Route path="/community/b/:boardName" element={<BoardFeed />} />
            <Route path="/community/post/:postId" element={<PostDetail />} />
          </Route>

          {/* ==========================================================================
              2. PROTECTED MEMBER ROUTES (Session verified)
              ========================================================================== */}
          <Route element={<ProtectedRoute />}>
            {/* Standalone Onboarding screen (no standard sidebar/nav headers) */}
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/suspended" element={<Suspended />} />
            <Route path="/banned" element={<Banned />} />

            {/* Nested under App Sidebar / Top Layout */}
            <Route element={<AppLayout />}>
              <Route path="/feed" element={<Feed />} />
              <Route path="/search" element={<Search />} />
              <Route path="/activities/:id" element={<ActivityDetail />} />
              <Route path="/activities/create" element={<CreateActivity />} />
              <Route path="/activities/:id/edit" element={<EditActivity />} />
              <Route path="/activities/:id/setup" element={<SetupActivity />} />
              <Route path="/activities/:id/requests" element={<JoinRequestsPage />} />
              <Route path="/profile/me" element={<MyProfile />} />
              <Route path="/profile/me/edit" element={<EditProfile />} />
              <Route path="/profile/me/emergency" element={<EmergencyContacts />} />
              <Route path="/profile/me/settings" element={<Settings />} />
              <Route path="/profile/me/settings/notifications" element={<NotificationPreferencesPage />} />
              <Route path="/profile/me/verify-phone" element={<VerifyPhone />} />
              <Route path="/profile/me/verify-phone/check" element={<VerifyPhoneCheck />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="/profile/:userId/followers" element={<FollowersListPage />} />
              <Route path="/profile/:userId/following" element={<FollowingListPage />} />
               <Route path="/notifications" element={<Notifications />} />
              
              {/* Authenticated Community Write Actions */}
              <Route path="/community/submit" element={<SubmitPost />} />
              <Route path="/community/create" element={<CreateBoard />} />
              <Route path="/community/mod-queue" element={<ModQueue />} />
              
              {/* Trip Room chat layout, mutual ratings & memory walls */}
              <Route path="/trip-rooms/:id" element={<TripRoom />} />
              <Route path="/activities/:id/rate" element={<RatingPage />} />
              <Route path="/memory-walls/:id" element={<MemoryWallDetailPage />} />
            </Route>
          </Route>

          {/* ==========================================================================
              3. ADMIN MANAGEMENT ROUTES (Role === admin)
              ========================================================================== */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/users/:id" element={<AdminUserDetail />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/activity-reports" element={<AdminActivityReports />} />
              <Route path="/admin/activities" element={<AdminActivities />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/broadcast" element={<AdminBroadcast />} />
              <Route path="/admin/ip-blocks" element={<AdminIPBlocks />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* ==========================================================================
              4. FALLBACK REDIRECTS
              ========================================================================== */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default AppRouter
export { AppRouter }
