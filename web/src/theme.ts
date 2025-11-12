import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#34495e', // Графитовый/Мокрый асфальт
    },
    secondary: {
      main: '#f39c12', // Янтарный/Оранжевый
    },
    error: {
      main: '#e74c3c',
    },
    background: {
      default: '#f4f7f6', // Приятный светлый фон
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h4: {
      color: '#2c3e50',
    },
    h5: {
      color: '#34495e',
      marginTop: '32px',
      marginBottom: '16px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 'bold',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.1)',
          transition: '0.3s ease-in-out',
          borderRadius: 12,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 5px 15px -3px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
      },
    },
  },
});
