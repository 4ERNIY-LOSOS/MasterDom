import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { OffersPage } from './pages/OffersPage';
import { AdminPage } from './pages/AdminPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function Navigation() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="main-nav">
      <Link to="/">MasterDom</Link>
      <ul>
        <li><Link to="/">{t('nav.home')}</Link></li>
        <li><Link to="/offers">{t('nav.offers')}</Link></li>
        {user && user.isAdmin && (
          <li><Link to="/admin">{t('nav.adminPanel')}</Link></li>
        )}
        {user ? (
          <>
            <li><span>User ID: {user.userId}</span></li>
            <li><button onClick={logout} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem'}}>{t('nav.logout')}</button></li>
          </>
        ) : (
          <>
            <li><Link to="/login">{t('nav.login')}</Link></li>
            <li><Link to="/register">{t('nav.register')}</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}

function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  return (
    <div className="page-container">
      <h1>{t('homePage.welcome')}</h1>
      {user ? (
        <p>{t('homePage.loggedIn', { userId: user.userId })}</p>
      ) : (
        <p>{t('homePage.loggedOut')}</p>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div>
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
