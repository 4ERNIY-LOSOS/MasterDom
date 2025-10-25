import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(t('loginPage.loggingIn'));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      login(data.token);

      setMessage(t('loginPage.success'));

      setTimeout(() => {
        navigate('/');
      }, 1000);

    } catch (error: any) {
      setMessage(`${t('loginPage.errorPrefix')}: ${error.message}`);
      console.error('Login error:', error);
    }
  };

  return (
    <div className="form-container">
      <h2>{t('loginPage.title')}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('loginPage.emailPlaceholder')}
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('loginPage.passwordPlaceholder')}
          required
        />
        <button type="submit">{t('loginPage.loginButton')}</button>
      </form>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
}