import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { CatalogProvider } from './contexts/CatalogContext';
import Layout from './components/Layout';
import HomePage from './screens/HomePage';
import SearchPage from './screens/SearchPage';
import LibraryPage from './screens/LibraryPage';
import MetadataPage from './screens/MetadataPage';
import StreamsPage from './screens/StreamsPage';
import PlayerPage from './screens/PlayerPage';
import SettingsPage from './screens/SettingsPage';
import LoginPage from './screens/LoginPage';
import RegisterPage from './screens/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './screens/AdminDashboard';

function App() {
  return (
    <ThemeProvider>
      <CatalogProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="metadata/:type/:id" element={<MetadataPage />} />

            <Route element={<ProtectedRoute requireApproval />}>
              <Route path="streams/:type/:id" element={<StreamsPage />} />
              <Route path="player" element={<PlayerPage />} />
            </Route>

            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="admin" element={<AdminDashboard />} />
            </Route>

            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </CatalogProvider>
    </ThemeProvider>
  );
}

export default App;

