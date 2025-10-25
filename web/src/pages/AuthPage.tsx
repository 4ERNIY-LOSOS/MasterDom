import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import './RegisterPage.css';

export function AuthPage() {
  const { t } = useTranslation();
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="page-container">
      <h2>{isLoginView ? t('loginPage.title') : t('registerPage.title')}</h2>
      
      {isLoginView ? (
        <LoginForm />
      ) : (
        <RegisterForm onSuccess={() => setIsLoginView(true)} />
      )}

      <div className="auth-toggle">
        <button onClick={() => setIsLoginView(!isLoginView)} className="toggle-button">
          {isLoginView ? t('authPage.toggleToRegister') : t('authPage.toggleToLogin')}
        </button>
      </div>
    </div>
  );
}