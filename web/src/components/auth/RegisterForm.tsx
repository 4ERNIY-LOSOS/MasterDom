import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isPasswordValid = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError(t('registerPage.validation.passwordMinLength', { min: 8 }));
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = t('registerPage.errors.default');
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = errorText || errorMessage; // Use raw text if not JSON
        }
        throw new Error(errorMessage);
      }
      
      onSuccess();

    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
          setError(t('errors.emailInUse'));
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
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        margin="normal"
        required
        fullWidth
        id="firstName"
        label={t('registerPage.firstNameLabel')}
        name="firstName"
        autoComplete="given-name"
        autoFocus
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        disabled={submitting}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label={t('registerPage.emailLabel')}
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label={t('registerPage.passwordLabel')}
        type="password"
        id="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={submitting}
        error={password.length > 0 && !isPasswordValid}
        helperText={password.length > 0 && !isPasswordValid ? t('registerPage.validation.passwordMinLength', { min: 8 }) : ''}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={submitting || !firstName || !email || !password}
      >
        {submitting ? <CircularProgress size={24} color="inherit" /> : t('registerPage.submitButton')}
      </Button>
    </Box>
  );
}
