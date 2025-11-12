import { useTranslation } from 'react-i18next';
import {
  Typography, Card, CardContent, TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, Button, Box, Chip
} from '@mui/material';

interface AdminOfferResponse {
  id: string;
  title: string;
  authorFirstName: string;
  authorEmail: string;
  isActive: boolean;
}

interface OfferTableProps {
  offers: AdminOfferResponse[];
  onToggleStatus: (offer: AdminOfferResponse) => Promise<void> | void;
  onDelete: (offer: AdminOfferResponse) => void;
}

export function OfferTable({ offers, onToggleStatus, onDelete }: OfferTableProps) {
  const { t } = useTranslation();

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {t('adminPage.offerManagementTitle')}
        </Typography>
        {offers.length === 0 ? (
          <Typography>No offers found.</Typography>
        ) : (
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('adminPage.offerTable.title')}</TableCell>
                  <TableCell>{t('adminPage.offerTable.author')}</TableCell>
                  <TableCell align="center">{t('adminPage.offerTable.status')}</TableCell>
                  <TableCell align="right">{t('adminPage.offerTable.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offers.map((o) => (
                  <TableRow key={o.id} hover>
                    <TableCell>{o.title}</TableCell>
                    <TableCell>{o.authorFirstName} ({o.authorEmail})</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={o.isActive ? t('adminPage.offerTable.active') : t('adminPage.offerTable.inactive')}
                        color={o.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="outlined" onClick={() => onToggleStatus(o)}>
                          {o.isActive ? t('adminPage.buttons.deactivate') : t('adminPage.buttons.activate')}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => onDelete(o)}
                        >
                          {t('adminPage.buttons.delete')}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
