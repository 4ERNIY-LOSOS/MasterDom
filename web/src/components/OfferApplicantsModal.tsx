import { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Typography, Divider, CircularProgress, Alert, Box, ListItemSecondaryAction
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

// Based on api/models/models.go
interface Applicant {
  id: string;
  offerId: string;
  applicantId: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  applicantFirstName: string;
  applicantRating: number;
}

interface OfferApplicantsModalProps {
  open: boolean;
  onClose: () => void;
  offerId: string | null;
}

export function OfferApplicantsModal({ open, onClose, offerId }: OfferApplicantsModalProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [initiatingChatWith, setInitiatingChatWith] = useState<string | null>(null);

  useEffect(() => {
    if (open && offerId) {
      const fetchApplicants = async () => {
        setLoading(true);
        setError(null);
        setChatError(null);
        try {
          const response = await fetch(`/api/offers/${offerId}/applications`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Не удалось загрузить отклики');
          const data = await response.json();
          setApplicants(data || []);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Произошла неизвестная ошибка');
        } finally {
          setLoading(false);
        }
      };
      fetchApplicants();
    }
  }, [open, offerId, token]);

  const handleInitiateChat = async (recipientId: string) => {
    if (!offerId || !token) return;
    setInitiatingChatWith(recipientId);
    setChatError(null);
    try {
      const response = await fetch('/api/chats/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ offerId, recipientId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Не удалось начать чат');
      }
      const { conversationId } = await response.json();
      navigate(`/chats/${conversationId}`);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : 'Произошла неизвестная ошибка');
    } finally {
      setInitiatingChatWith(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
    }
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    if (applicants.length === 0) {
      return <Typography>На это объявление еще нет откликов.</Typography>;
    }
    return (
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {chatError && <Alert severity="error" sx={{ mb: 2 }}>{chatError}</Alert>}
        {applicants.map((applicant, index) => (
          <Fragment key={applicant.id}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar alt={applicant.applicantFirstName} />
              </ListItemAvatar>
              <ListItemText
                primary={`${applicant.applicantFirstName} (Рейтинг: ${typeof applicant.applicantRating === 'number' ? applicant.applicantRating.toFixed(1) : 'N/A'})`}
                secondary={
                  <Typography component="span" variant="body2" color="text.primary">
                    {applicant.message}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleInitiateChat(applicant.applicantId)}
                  disabled={initiatingChatWith === applicant.applicantId}
                >
                  {initiatingChatWith === applicant.applicantId ? <CircularProgress size={20} /> : 'Написать'}
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            {index < applicants.length - 1 && <Divider variant="inset" component="li" />}
          </Fragment>
        ))}
      </List>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Отклики на объявление</DialogTitle>
      <DialogContent>
        {renderContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}