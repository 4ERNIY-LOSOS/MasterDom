import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Container, Paper, List, ListItem, ListItemText,
  TextField, Button, CircularProgress, Alert, Avatar, AppBar, Toolbar
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

// Matches models.ChatDetailsResponse
interface ChatDetails {
  conversationId: string;
  offerTitle: string;
  offerId: string;
  participants: Array<{
    id: string;
    firstName: string | null;
  }>;
}

// Matches models.MessageResponse
interface Message {
  id: string;
  senderId: string;
  senderFirstName: string;
  content: string;
  createdAt: string;
}

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user, token } = useAuth();
  const [details, setDetails] = useState<ChatDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!chatId || !token) return;

    const fetchChatData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch details and messages in parallel
        const [detailsRes, messagesRes] = await Promise.all([
          fetch(`/api/chats/${chatId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`/api/chats/${chatId}/messages`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!detailsRes.ok) throw new Error('Не удалось загрузить детали чата');
        const detailsData = await detailsRes.json();
        setDetails(detailsData);

        if (!messagesRes.ok) throw new Error('Не удалось загрузить сообщения');
        const messagesData = await messagesRes.json();
        setMessages(messagesData || []);

      } catch (e) {
        setError(e instanceof Error ? e.message : 'Произошла неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [chatId, token]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !token) return;

    setSending(true);
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });
      if (!response.ok) throw new Error('Не удалось отправить сообщение');
      
      const sentMessage = await response.json();
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при отправке');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <Container sx={{ textAlign: 'center', mt: 5 }}><CircularProgress /></Container>;
  }

  if (error) {
    return <Container sx={{ mt: 5 }}><Alert severity="error">{error}</Alert></Container>;
  }

  const otherParticipant = details?.participants.find(p => p.id !== user?.userId);

  return (
    <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', p: 0 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Avatar sx={{ mr: 2 }}>{otherParticipant?.firstName?.charAt(0)}</Avatar>
          <Box>
            <Typography variant="h6">{otherParticipant?.firstName || 'Собеседник'}</Typography>
            <Typography variant="body2" color="text.secondary">Тема: {details?.offerTitle}</Typography>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Paper elevation={0} sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: 'grey.100' }}>
        <List>
          {messages.map(msg => (
            <ListItem key={msg.id} sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.senderId === user?.userId ? 'flex-end' : 'flex-start',
            }}>
              <Paper elevation={1} sx={{
                p: 1.5,
                borderRadius: 4,
                bgcolor: msg.senderId === user?.userId ? 'primary.main' : 'background.paper',
                color: msg.senderId === user?.userId ? 'primary.contrastText' : 'text.primary',
                maxWidth: '70%',
              }}>
                <ListItemText
                  primary={msg.content}
                  secondary={
                    <Typography variant="caption" sx={{ color: msg.senderId === user?.userId ? 'rgba(255,255,255,0.7)' : 'text.secondary', mt: 0.5, display: 'block', textAlign: 'right' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  }
                />
              </Paper>
            </ListItem>
          ))}
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Напишите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" variant="contained" sx={{ ml: 1 }} disabled={sending || !newMessage.trim()}>
            {sending ? <CircularProgress size={24} /> : 'Отправить'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}