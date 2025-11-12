import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

import { AdminPage } from './pages/AdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { ChatPage } from './pages/ChatPage';
import { ConversationsPage } from './pages/ConversationsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { theme } from './theme';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
// import './App.css'; // Этот файл пуст, его можно удалить

function Navigation() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
          MasterDom
        </Typography>
        <Box>
          <Button component={RouterLink} to="/" color="inherit">{t('nav.home')}</Button>
          {user && (
            <>
              <Button component={RouterLink} to="/messages" color="inherit">Сообщения</Button>
              <Button component={RouterLink} to="/profile" color="inherit">{t('nav.profile')}</Button>
            </>
          )}
          {user && user.isAdmin && (
            <Button component={RouterLink} to="/admin" color="inherit">{t('nav.adminPanel')}</Button>
          )}
          {user ? (
            <Button onClick={logout} color="inherit">{t('nav.logout')}</Button>
          ) : (
            <Button component={RouterLink} to="/auth" color="inherit">{t('nav.auth')}</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navigation />
            <Box component="main" sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/messages" element={<ConversationsPage />} />
                  <Route path="/chats/:chatId" element={<ChatPage />} />
                </Route>
              </Routes>
            </Box>
          </Box>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
