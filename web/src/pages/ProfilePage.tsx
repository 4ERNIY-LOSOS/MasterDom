import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

// Определяем интерфейс для данных профиля пользователя
interface UserProfile {
  firstName: string;
  lastName: string | null;
  phoneNumber: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
}

export function ProfilePage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Загрузка данных профиля
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch profile data.');
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Обработчик изменений в форме
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value || null } : null);
  };

  // Обработчик сохранения
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...profile,
          yearsOfExperience: profile.yearsOfExperience ? Number(profile.yearsOfExperience) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to update profile.');
      }

      setMessage(t('profilePage.successMessage'));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  if (loading) {
    return <div className="page-container">{t('profilePage.loading')}</div>;
  }

  if (error && !profile) {
    return <div className="page-container">{t('loginPage.errorPrefix')}: {error}</div>;
  }

  return (
    <div className="page-container">
      <h2>{t('profilePage.title')}</h2>
      {profile && (
        <form onSubmit={handleSubmit} className="auth-form">
          {message && <p className="form-message success-message">{message}</p>}
          {error && <p className="form-message error-message">{error}</p>}

          <label>{t('profilePage.firstNameLabel')}</label>
          <input
            type="text"
            name="firstName"
            value={profile.firstName || ''}
            onChange={handleChange}
            required
          />

          <label>{t('profilePage.lastNameLabel')}</label>
          <input
            type="text"
            name="lastName"
            value={profile.lastName || ''}
            onChange={handleChange}
          />

          <label>{t('profilePage.phoneLabel')}</label>
          <input
            type="tel"
            name="phoneNumber"
            value={profile.phoneNumber || ''}
            onChange={handleChange}
          />

          <label>{t('profilePage.bioLabel')}</label>
          <textarea
            name="bio"
            value={profile.bio || ''}
            onChange={handleChange}
            placeholder={t('profilePage.bioPlaceholder')}
          />

          <label>{t('profilePage.experienceLabel')}</label>
          <input
            type="number"
            name="yearsOfExperience"
            value={profile.yearsOfExperience || ''}
            onChange={handleChange}
          />

          <button type="submit">{t('profilePage.saveButton')}</button>
        </form>
      )}
    </div>
  );
}
