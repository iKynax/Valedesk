import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import AIWidget from './components/AIWidget';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardHome from './pages/dashboard/DashboardHome';
import RoomsPage from './pages/dashboard/RoomsPage';
import RoomDetailPage from './pages/dashboard/RoomDetailPage';
import BookRoomPage from './pages/dashboard/BookRoomPage';
import BookingsPage from './pages/dashboard/BookingsPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import FavouritesPage from './pages/dashboard/FavouritesPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import AdminAccessPage from './pages/admin/AdminAccessPage';
import AdminAuthPage from './pages/admin/AdminAuthPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminRoomsPage from './pages/admin/AdminRoomsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import { Toaster } from 'sonner';
import { AuthProvider } from './components/AuthProvider';
import { DarkModeProvider } from './hooks/useDarkMode';

export default function App() {
  return (
    <DarkModeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          {/* User Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardHome />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="rooms/:id" element={<RoomDetailPage />} />
            <Route path="book/:roomId" element={<BookRoomPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="favourites" element={<FavouritesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* Admin Access & Auth (public — guarded internally) */}
          <Route path="/admin/access" element={<AdminAccessPage />} />
          <Route path="/admin/auth" element={<AdminAuthPage />} />

          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
             <Route index element={<AdminDashboardPage />} />
             <Route path="analytics" element={<AdminAnalyticsPage />} />
             <Route path="bookings" element={<AdminBookingsPage />} />
             <Route path="rooms" element={<AdminRoomsPage />} />
             <Route path="users" element={<AdminUsersPage />} />
             <Route path="promotions" element={<AdminPromotionsPage />} />
             <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AIWidget />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthProvider>
    </DarkModeProvider>
  );
}
