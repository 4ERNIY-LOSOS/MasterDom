import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OfferList } from '../components/OfferList';
import { useAuth } from '../context/AuthContext';

// Эти компоненты можно было бы вынести в свои файлы, но для простоты оставим здесь

interface ServiceCategory {
  id: number;
  name: string;
}

type OfferType = 'service_offer' | 'request_for_service';

function CreateOfferForm({ onOfferCreated, onClose }: { onOfferCreated: (offerType: OfferType) => void, onClose: () => void }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedOfferType, setSelectedOfferType] = useState<OfferType>('service_offer');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setLoading] = useState(false);

  useEffect(() => {
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
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
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.details || errorData.error || 'Failed to create offer');
        } catch (jsonError) {
          throw new Error(text || 'Failed to create offer');
        }
      }
      setTitle('');
      setDescription('');
      setCategoryId(undefined);
      onOfferCreated(selectedOfferType);
      onClose(); // Закрываем модальное окно после успеха
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError('An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-content">
      <form onSubmit={handleSubmit} className="create-offer-form">
        <h3>{t('offersPage.createOfferTitle')}</h3>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label>{t('offersPage.offerTypeLabel')}</label>
          <div><label><input type="radio" value="service_offer" checked={selectedOfferType === 'service_offer'} onChange={() => setSelectedOfferType('service_offer')} /> {t('offersPage.offerTypeMaster')}</label></div>
          <div><label><input type="radio" value="request_for_service" checked={selectedOfferType === 'request_for_service'} onChange={() => setSelectedOfferType('request_for_service')} /> {t('offersPage.offerTypeClient')}</label></div>
        </div>
        <div className="form-group">
          <label htmlFor="categoryId">{t('offersPage.categoryLabel')}</label>
          <select id="categoryId" value={categoryId || ''} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">{t('offersPage.selectCategory')}</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="title">{t('offersPage.titleLabel')}</label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="description">{t('offersPage.descriptionLabel')}</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="modal-actions">
            <button type="submit" disabled={submitting}>{submitting ? t('offersPage.submitting') : t('offersPage.createOfferButton')}</button>
            <button type="button" onClick={onClose}>{t('adminPage.buttons.cancel')}</button>
        </div>
      </form>
    </div>
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

  const handleFilter = () => {
    onFilterChange({ search, category });
  };

  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder={t('offersPage.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">{t('offersPage.allCategories')}</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <button onClick={handleFilter}>{t('offersPage.applyFiltersButton')}</button>
    </div>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<OfferType>('service_offer');
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        type: viewType,
        search: filters.search,
        category: filters.category,
      });
      try {
        const response = await fetch(`/api/offers?${params.toString()}`);
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
  }, [viewType, filters]);

  const handleOfferCreated = (createdType: OfferType) => {
    setViewType(createdType);
    setFilters({ search: '', category: '' }); // Сбрасываем фильтры
  };

  return (
    <div className="page-container">
      <h1>{t('homePage.welcome')}</h1>
      {!user && <p>{t('homePage.loggedOut')}</p>}

      {user && (
        <div className="create-offer-button-container">
            <button onClick={() => setCreateModalOpen(true)}>{t('offersPage.createOfferTitle')}</button>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="modal-overlay">
            <CreateOfferForm 
                onOfferCreated={handleOfferCreated} 
                onClose={() => setCreateModalOpen(false)} 
            />
        </div>
      )}

      <hr />

      <div className="view-toggle">
        <button onClick={() => setViewType('service_offer')} className={viewType === 'service_offer' ? 'active' : ''}>{t('offersPage.mastersOffers')}</button>
        <button onClick={() => setViewType('request_for_service')} className={viewType === 'request_for_service' ? 'active' : ''}>{t('offersPage.clientsRequests')}</button>
      </div>
      
      <FilterBar onFilterChange={setFilters} />

      <OfferList offers={offers} loading={loading} error={error} />
    </div>
  );
}
