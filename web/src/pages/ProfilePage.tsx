import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Container, Box, Typography, TextField, Button, Card, CardContent,
  CircularProgress, Alert
} from '@mui/material';

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

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch profile data.');
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => prev ? { ...prev, [name]: value || null } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...profile,
          yearsOfExperience: profile.yearsOfExperience ? Number(profile.yearsOfExperience) : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Failed to update profile.');
      setMessage(t('profilePage.successMessage'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  if (error && !profile) {
    return <Container maxWidth="sm" sx={{ mt: 4 }}><Alert severity="error">{t('loginPage.errorPrefix')}: {error}</Alert></Container>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {t('profilePage.title')}
            </Typography>
            {profile && (
              <Box component="form" onSubmit={handleSubmit} noValidate>
                {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label={t('profilePage.firstNameLabel')}
                  name="firstName"
                  value={profile.firstName || ''}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label={t('profilePage.lastNameLabel')}
                  name="lastName"
                  value={profile.lastName || ''}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label={t('profilePage.phoneLabel')}
                  name="phoneNumber"
                  type="tel"
                  value={profile.phoneNumber || ''}
                  onChange={handleChange}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  multiline
                  rows={4}
                  label={t('profilePage.bioLabel')}
                  name="bio"
                  value={profile.bio || ''}
                  onChange={handleChange}
                  placeholder={t('profilePage.bioPlaceholder')}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label={t('profilePage.experienceLabel')}
                  name="yearsOfExperience"
                  type="number"
                  value={profile.yearsOfExperience || ''}
                  onChange={handleChange}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                >
                  {t('profilePage.saveButton')}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
