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
// Core Public Pages (directly imported to prevent any post-deployment chunk 404s)
import Landing from '../pages/Landing.jsx'
import Login from '../pages/Login.jsx'
import Signup from '../pages/Signup.jsx'
import GoogleCallback from '../pages/GoogleCallback.jsx'
import Feed from '../pages/Feed.jsx'

// Robust lazy loader with automatic single-retry reload for stale production chunks
export const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport()
    } catch (error) {
      const isChunkLoadFailed =
        error?.name === 'ChunkLoadError' ||
        /Failed to fetch dynamically imported module/i.test(error?.message || '') ||
        /Loading chunk/i.test(error?.message || '') ||
        /error loading dynamically imported module/i.test(error?.message || '')

      const hasReloaded = sessionStorage.getItem('chunk_reload_attempted')

      if (isChunkLoadFailed && !hasReloaded) {
        sessionStorage.setItem('chunk_reload_attempted', 'true')
        window.location.reload()
        return new Promise(() => {}) // Wait for browser to reload
      }

      throw error
    }
  })

// Remaining Public Pages (Lazy Loaded with Auto-Retry)
const VerifyEmail = lazyWithRetry(() => import('../pages/VerifyEmail.jsx'))
const VerifyPhone = lazyWithRetry(() => import('../pages/VerifyPhone.jsx'))
const VerifyPhoneCheck = lazyWithRetry(() => import('../pages/VerifyPhoneCheck.jsx'))
const CompleteSignup = lazyWithRetry(() => import('../pages/CompleteSignup.jsx'))
const ForgotPassword = lazyWithRetry(() => import('../pages/ForgotPassword.jsx'))
const ResetPassword = lazyWithRetry(() => import('../pages/ResetPassword.jsx'))
const ShareActivity = lazyWithRetry(() => import('../pages/ShareActivity.jsx'))
const Terms = lazyWithRetry(() => import('../pages/Terms.jsx'))
const Privacy = lazyWithRetry(() => import('../pages/Privacy.jsx'))
const NotFound = lazyWithRetry(() => import('../pages/NotFound.jsx'))
const Maintenance = lazyWithRetry(() => import('../pages/Maintenance.jsx'))

// Protected App Pages
const Onboarding = lazyWithRetry(() => import('../pages/Onboarding.jsx'))
const Search = lazyWithRetry(() => import('../pages/Search.jsx'))
const ActivityDetail = lazyWithRetry(() => import('../pages/ActivityDetail.jsx'))
const CreateActivity = lazyWithRetry(() => import('../pages/CreateActivity.jsx'))
const EditActivity = lazyWithRetry(() => import('../pages/EditActivity.jsx'))
const SetupActivity = lazyWithRetry(() => import('../pages/SetupActivity.jsx'))
const MyProfile = lazyWithRetry(() => import('../pages/MyProfile.jsx'))
const EditProfile = lazyWithRetry(() => import('../pages/EditProfile.jsx'))
const EmergencyContacts = lazyWithRetry(() => import('../pages/EmergencyContacts.jsx'))
const Settings = lazyWithRetry(() => import('../pages/Settings.jsx'))
const NotificationSettings = lazyWithRetry(() => import('../pages/NotificationSettings.jsx'))
const UserProfile = lazyWithRetry(() => import('../pages/UserProfile.jsx'))
const TripRoom = lazyWithRetry(() => import('../pages/TripRoom.jsx'))
const Notifications = lazyWithRetry(() => import('../pages/Notifications.jsx'))
const JoinRequestsPage = lazyWithRetry(() => import('../pages/activities/JoinRequestsPage.jsx'))
const RatingPage = lazyWithRetry(() => import('../pages/rating/RatingPage.jsx'))
const MemoryWallDetailPage = lazyWithRetry(() => import('../pages/memory/MemoryWallDetailPage.jsx'))
const NotificationPreferencesPage = lazyWithRetry(() => import('../pages/settings/NotificationPreferencesPage.jsx'))
const FollowersListPage = lazyWithRetry(() => import('../pages/social/FollowersListPage.jsx'))
const FollowingListPage = lazyWithRetry(() => import('../pages/social/FollowingListPage.jsx'))
const Suspended = lazyWithRetry(() => import('../pages/Suspended.jsx'))
const Banned = lazyWithRetry(() => import('../pages/Banned.jsx'))
const Offline = lazyWithRetry(() => import('../pages/Offline.jsx'))

// Community Pages
const CommunityFeed = lazyWithRetry(() => import('../pages/community/CommunityFeed.jsx'))
const BoardFeed = lazyWithRetry(() => import('../pages/community/BoardFeed.jsx'))
const PostDetail = lazyWithRetry(() => import('../pages/community/PostDetail.jsx'))
const SubmitPost = lazyWithRetry(() => import('../pages/community/SubmitPost.jsx'))
const CreateBoard = lazyWithRetry(() => import('../pages/community/CreateBoard.jsx'))
const ModQueue = lazyWithRetry(() => import('../pages/community/ModQueue.jsx'))

// Admin Pages
const AdminDashboard = lazyWithRetry(() => import('../pages/admin/AdminDashboard.jsx'))
const AdminUsers = lazyWithRetry(() => import('../pages/admin/AdminUsers.jsx'))
const AdminUserDetail = lazyWithRetry(() => import('../pages/admin/AdminUserDetail.jsx'))
const AdminReports = lazyWithRetry(() => import('../pages/admin/AdminReports.jsx'))
const AdminActivityReports = lazyWithRetry(() => import('../pages/admin/AdminActivityReports.jsx'))
const AdminActivities = lazyWithRetry(() => import('../pages/admin/AdminActivities.jsx'))
const AdminAnalytics = lazyWithRetry(() => import('../pages/admin/AdminAnalytics.jsx'))
const AdminBroadcast = lazyWithRetry(() => import('../pages/admin/AdminBroadcast.jsx'))
const AdminIPBlocks = lazyWithRetry(() => import('../pages/admin/AdminIPBlocks.jsx'))
const AdminLogs = lazyWithRetry(() => import('../pages/admin/AdminLogs.jsx'))
const AdminSettings = lazyWithRetry(() => import('../pages/admin/AdminSettings.jsx'))

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
