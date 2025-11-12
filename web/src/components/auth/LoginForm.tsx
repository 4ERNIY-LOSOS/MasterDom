import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';

export function LoginForm() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = t('loginPage.errors.default');
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (jsonError) {
          errorMessage = errorText || errorMessage; // Use raw text if not JSON
        }
        throw new Error(errorMessage);
      }

      const data = await response.json(); // Only parse as JSON if response is OK
      login(data.token);
      navigate('/'); // Redirect to home on successful login

    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid credentials')) {
          setError(t('errors.invalidCredentials'));
        } else {
          setError(err.message);
        }
      } else {
        setError(t('errors.default'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label={t('loginPage.emailLabel')}
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label={t('loginPage.passwordLabel')}
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={submitting}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={submitting || !email || !password}
      >
        {submitting ? <CircularProgress size={24} color="inherit" /> : t('loginPage.submitButton')}
      </Button>
    </Box>
  );
}
