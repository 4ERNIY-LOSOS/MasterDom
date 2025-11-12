import { useTranslation } from 'react-i18next';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

interface AdminStats {
  totalUsers: number;
  totalOffers: number;
  totalJobs: number;
  totalServiceRequests: number;
  totalServiceOffers: number;
}

interface AdminStatsProps {
  stats: AdminStats | null;
}

export function AdminStats({ stats }: AdminStatsProps) {
  const { t } = useTranslation();

  if (!stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statItems = [
    { title: t('adminPage.stats.totalUsers'), value: stats.totalUsers },
    { title: t('adminPage.stats.totalOffers'), value: stats.totalOffers },
    { title: t('adminPage.stats.totalJobs'), value: stats.totalJobs },
    { title: t('adminPage.stats.serviceRequests'), value: stats.totalServiceRequests },
    { title: t('adminPage.stats.serviceOffers'), value: stats.totalServiceOffers },
  ];

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        {t('adminPage.dashboardTitle')}
      </Typography>
      <Grid container spacing={2}>
        {statItems.map((item, index) => (
          <Grid 
            key={index}
            sx={{
              gridColumn: {
                xs: 'span 12',
                sm: 'span 6',
                md: 'span 4',
              }
            }}
          >
            <Card sx={{ textAlign: 'center', boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" component="h3">
                  {item.title}
                </Typography>
                <Typography variant="h4" component="p">
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
