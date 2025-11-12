import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export function AuthPage() {
  const { t } = useTranslation();
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card sx={{ width: '100%', maxWidth: 450 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography component="h1" variant="h5" align="center" sx={{ mb: 3 }}>
              {isLoginView ? t('loginPage.title') : t('registerPage.title')}
            </Typography>
            
            {isLoginView ? (
              <LoginForm />
            ) : (
              <RegisterForm onSuccess={() => setIsLoginView(true)} />
            )}
          </CardContent>
        </Card>
        <Button
          onClick={() => setIsLoginView(!isLoginView)}
          sx={{ mt: 2 }}
        >
          {isLoginView ? t('authPage.toggleToRegister') : t('authPage.toggleToLogin')}
        </Button>
      </Box>
    </Container>
  );
}