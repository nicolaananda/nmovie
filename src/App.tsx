import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { CatalogProvider } from './contexts/CatalogContext';
import { ToastProvider } from './contexts/ToastContext';
import { I18nProvider } from './i18n/I18nContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPrompt from './components/InstallPrompt';

// Route-level code splitting. Anonymous users won't pay for the admin
// dashboard or player bundle on first paint.
const HomePage = lazy(() => import('./screens/HomePage'));
const SearchPage = lazy(() => import('./screens/SearchPage'));
const LibraryPage = lazy(() => import('./screens/LibraryPage'));
const MetadataPage = lazy(() => import('./screens/MetadataPage'));
const StreamsPage = lazy(() => import('./screens/StreamsPage'));
const PlayerPage = lazy(() => import('./screens/PlayerPage'));
const SettingsPage = lazy(() => import('./screens/SettingsPage'));
const LoginPage = lazy(() => import('./screens/LoginPage'));
const RegisterPage = lazy(() => import('./screens/RegisterPage'));
const ProfilePage = lazy(() => import('./screens/ProfilePage'));
const WatchHistoryPage = lazy(() => import('./screens/WatchHistoryPage'));
const EnhancedAdminDashboard = lazy(() => import('./screens/EnhancedAdminDashboard'));
const AdminUserDetail = lazy(() => import('./screens/AdminUserDetail'));
const GenrePage = lazy(() => import('./screens/GenrePage'));
const ForgotPasswordPage = lazy(() => import('./screens/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./screens/ResetPasswordPage'));
const DonatePage = lazy(() => import('./screens/DonatePage'));

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <LoadingSpinner size="large" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <CatalogProvider>
            <InstallPrompt />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="genres" element={<GenrePage />} />
                  <Route path="library" element={<LibraryPage />} />
                  <Route path="metadata/:type/:id" element={<MetadataPage />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="history" element={<WatchHistoryPage />} />
                  </Route>

                  <Route element={<ProtectedRoute requireApproval />}>
                    <Route path="streams/:type/:id" element={<StreamsPage />} />
                    <Route path="player" element={<PlayerPage />} />
                  </Route>

                  <Route element={<ProtectedRoute adminOnly />}>
                    <Route path="admin" element={<EnhancedAdminDashboard />} />
                    <Route path="users/:id" element={<AdminUserDetail />} />
                  </Route>

                <Route path="settings" element={<SettingsPage />} />
                <Route path="donate" element={<DonatePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
              </Routes>
            </Suspense>
          </CatalogProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
