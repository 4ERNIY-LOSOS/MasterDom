import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container, Button, Typography, Box, Card, CardContent, CircularProgress, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, RadioGroup, FormControlLabel, Radio, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { OfferList } from '../components/OfferList';
import { OfferResponseModal } from '../components/OfferResponseModal';
import { OfferApplicantsModal } from '../components/OfferApplicantsModal';

interface ServiceCategory {
  id: number;
  name: string;
}

type OfferType = 'service_offer' | 'request_for_service';

function CreateOfferForm({ open, onClose, onOfferCreated }: { open: boolean, onClose: () => void, onOfferCreated: (offerType: OfferType) => void }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedOfferType, setSelectedOfferType] = useState<OfferType>('service_offer');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchCategories = async () => {
        try {
          const response = await fetch('/api/categories');
          if (!response.ok) throw new Error('Failed to fetch categories');
          const data: ServiceCategory[] = await response.json();
          setCategories(data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchCategories();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        title,
        description,
        offerType: selectedOfferType,
        categoryId: categoryId ? parseInt(String(categoryId), 10) : null,
      };
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.details || errorData.error || 'Failed to create offer');
      }
      onOfferCreated(selectedOfferType);
      onClose();
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError('An unknown error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('offersPage.createOfferTitle')}</DialogTitle>
      <DialogContent>
        <Box component="form" id="create-offer-form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <FormControl component="fieldset" margin="normal">
            <RadioGroup row value={selectedOfferType} onChange={(e) => setSelectedOfferType(e.target.value as OfferType)}>
              <FormControlLabel value="service_offer" control={<Radio />} label={t('offersPage.offerTypeMaster')} />
              <FormControlLabel value="request_for_service" control={<Radio />} label={t('offersPage.offerTypeClient')} />
            </RadioGroup>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel id="category-label">{t('offersPage.categoryLabel')}</InputLabel>
            <Select labelId="category-label" value={categoryId} onChange={(e) => setCategoryId(e.target.value as number | '')} label={t('offersPage.categoryLabel')}>
              <MenuItem value=""><em>{t('offersPage.selectCategory')}</em></MenuItem>
              {categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField margin="normal" required fullWidth label={t('offersPage.titleLabel')} value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField margin="normal" fullWidth multiline rows={4} label={t('offersPage.descriptionLabel')} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('adminPage.buttons.cancel')}</Button>
        <Button type="submit" form="create-offer-form" variant="contained" disabled={submitting}>
          {submitting ? <CircularProgress size={24} /> : t('offersPage.createOfferButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FilterBar({ onFilterChange }: { onFilterChange: (filters: { search: string; category: string }) => void }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder={t('offersPage.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>{t('offersPage.categoryLabel')}</InputLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} label={t('offersPage.categoryLabel')}>
              <MenuItem value="">{t('offersPage.allCategories')}</MenuItem>
              {categories.map(cat => <MenuItem key={cat.id} value={String(cat.id)}>{cat.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => onFilterChange({ search, category })}>{t('offersPage.applyFiltersButton')}</Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<OfferType>('service_offer');
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [respondingToOffer, setRespondingToOffer] = useState<string | null>(null);
  const [viewingApplicantsFor, setViewingApplicantsFor] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ type: viewType, search: filters.search, category: filters.category });
      try {
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`/api/offers?${params.toString()}`, { headers });
        if (!response.ok) throw new Error(`Network response was not ok`);
        const data = await response.json();
        setOffers(data);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
        else setError('An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, [viewType, filters, token]);

  const handleOfferCreated = (createdType: OfferType) => {
    setViewType(createdType);
    setFilters({ search: '', category: '' });
    setNotification("Объявление успешно создано!");
  };

  const handleResponseSent = () => {
    setRespondingToOffer(null);
    setNotification("Ваш отклик успешно отправлен!");
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">{t('homePage.welcome')}</Typography>
        {user && <Button variant="contained" color="secondary" onClick={() => setCreateModalOpen(true)}>{t('offersPage.createOfferTitle')}</Button>}
      </Box>
      {!user && <Typography sx={{ mb: 2 }}>{t('homePage.loggedOut')}</Typography>}
      
      <CreateOfferForm open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onOfferCreated={handleOfferCreated} />
      <OfferResponseModal 
        open={!!respondingToOffer} 
        onClose={() => setRespondingToOffer(null)} 
        offerId={respondingToOffer}
        onResponseSent={handleResponseSent}
      />
      <OfferApplicantsModal
        open={!!viewingApplicantsFor}
        onClose={() => setViewingApplicantsFor(null)}
        offerId={viewingApplicantsFor}
      />
      <Snackbar 
        open={!!notification} 
        autoHideDuration={6000} 
        onClose={() => setNotification(null)}
        message={notification}
      />

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <ToggleButtonGroup
          color="primary"
          value={viewType}
          exclusive
          onChange={(_, newValue) => { if (newValue) setViewType(newValue); }}
        >
          <ToggleButton value="service_offer">{t('offersPage.mastersOffers')}</ToggleButton>
          <ToggleButton value="request_for_service">{t('offersPage.clientsRequests')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <FilterBar onFilterChange={setFilters} />

      <OfferList 
        offers={offers} 
        loading={loading} 
        error={error} 
        onRespond={setRespondingToOffer}
        onViewApplicants={setViewingApplicantsFor}
      />
    </Container>
  );
}
