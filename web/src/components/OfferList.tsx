import { Box, Card, CardContent, Typography, CircularProgress, Alert, CardActions, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface Offer {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorFirstName: string;
  createdAt: string;
  hasResponded: boolean;
}

interface OfferListProps {
  offers: Offer[];
  loading: boolean;
  error: string | null;
  onRespond: (offerId: string) => void;
  onViewApplicants: (offerId: string) => void;
}

export function OfferList({ offers, loading, error, onRespond, onViewApplicants }: OfferListProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  }

  if (offers.length === 0) {
    return <Typography sx={{ mt: 4, textAlign: 'center' }}>{t('offersPage.noOffers')}</Typography>;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
      }}
    >
      {offers.map((offer) => (
        <Card key={offer.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography gutterBottom variant="h5" component="h2">
              {offer.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('offersPage.postedBy')} {offer.authorFirstName}
            </Typography>
            <Typography>
              {offer.description}
            </Typography>
          </CardContent>
          <CardActions>
            {user && user.userId === offer.authorId && (
              <Button size="small" variant="outlined" onClick={() => onViewApplicants(offer.id)}>
                Просмотреть отклики
              </Button>
            )}
            {user && user.userId !== offer.authorId && (
              <Button
                size="small"
                variant="contained"
                onClick={() => onRespond(offer.id)}
                disabled={offer.hasResponded}
              >
                {offer.hasResponded ? "Отклик отправлен" : t('offersPage.respondButton')}
              </Button>
            )}
          </CardActions>
        </Card>
      ))}
    </Box>
  );
}
