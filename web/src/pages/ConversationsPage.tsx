import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Divider, CircularProgress, Alert, Box
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

// Matches models.ConversationPreview
interface ConversationPreview {
  conversationId: string;
  otherParticipantId: string;
  otherParticipantName: string;
  lastMessageContent: string;
  lastMessageAt: string;
  offerTitle: string;
}

export function ConversationsPage() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Пожалуйста, войдите, чтобы увидеть ваши сообщения.");
      return;
    }

    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/chats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Не удалось загрузить список чатов');
        }
        const data = await response.json();
        setConversations(data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Произошла неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [token]);

  const renderContent = () => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>;
    }
    if (error) {
      return <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>;
    }
    if (conversations.length === 0) {
      return <Typography sx={{ mt: 2 }}>У вас пока нет активных чатов.</Typography>;
    }
    return (
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {conversations.map((convo, index) => (
          <div key={convo.conversationId}>
            <ListItem
              alignItems="flex-start"
              component={RouterLink}
              to={`/chats/${convo.conversationId}`}
            >
              <ListItemAvatar>
                <Avatar alt={convo.otherParticipantName}>{convo.otherParticipantName.charAt(0)}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={convo.otherParticipantName}
                secondary={
                  <>
                    <Typography sx={{ display: 'block' }} component="span" variant="body2" color="text.primary">
                      Тема: {convo.offerTitle}
                    </Typography>
                    {convo.lastMessageContent}
                  </>
                }
              />
              <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
                {new Date(convo.lastMessageAt).toLocaleString()}
              </Typography>
            </ListItem>
            {index < conversations.length - 1 && <Divider variant="inset" component="li" />}
          </div>
        ))}
      </List>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Мои сообщения
      </Typography>
      {renderContent()}
    </Container>
  );
}
