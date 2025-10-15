import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { RegisterPage } from './pages/Register';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Компонент навигации, который использует контекст
function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="main-nav">
      <Link to="/">MasterDom</Link>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        {user ? (
          // Если пользователь вошел
          <>
            <li>
              <span>Role: {user.role}</span>
            </li>
            <li>
              <button onClick={logout} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem'}}>Logout</button>
            </li>
          </>
        ) : (
          // Если пользователь не вошел
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

function HomePage() {
  const { user } = useAuth();
  return (
    <div className="page-container">
      <h1>Welcome to MasterDom</h1>
      {user ? (
        <p>You are logged in. Your user ID is: {user.userId}</p>
      ) : (
        <p>Please login or register to use the service.</p>
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
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;