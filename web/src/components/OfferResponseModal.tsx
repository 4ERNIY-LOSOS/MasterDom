import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
  CircularProgress, Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

interface OfferResponseModalProps {
  open: boolean;
  onClose: () => void;
  offerId: string | null;
  onResponseSent: () => void;
}

export function OfferResponseModal({ open, onClose, offerId, onResponseSent }: OfferResponseModalProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!offerId) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/offers/${offerId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || t('offersPage.sendResponseError'));
      }
      onResponseSent();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.default'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setMessage('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('offersPage.responseModalTitle')}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          label={t('offersPage.responseMessageLabel')}
          placeholder={t('offersPage.responseMessagePlaceholder')}
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>{t('adminPage.buttons.cancel')}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : t('offersPage.sendResponseButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
