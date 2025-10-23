import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Offer {
  id: string;
  title: string;
  description: string;
  offerType: string;
  createdAt: string;
  authorId: string;
  authorFirstName: string;
}

interface ServiceCategory {
  id: number;
  name: string;
}

type OfferType = 'service_offer' | 'request_for_service';

function CreateOfferForm({ onOfferCreated }: { onOfferCreated: (offerType: OfferType) => void }) {
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
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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

    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-offer-form">
      <h3>Create New Offer</h3>
      {error && <p className="error-message">{error}</p>}
      <div className="form-group">
        <label>Offer Type:</label>
        <div>
          <label>
            <input
              type="radio"
              value="service_offer"
              checked={selectedOfferType === 'service_offer'}
              onChange={() => setSelectedOfferType('service_offer')}
            />
            Service Offer (I am a Master)
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              value="request_for_service"
              checked={selectedOfferType === 'request_for_service'}
              onChange={() => setSelectedOfferType('request_for_service')}
            />
            Service Request (I need a Master)
          </label>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="categoryId">Category</label>
        <select id="categoryId" value={categoryId || ''} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">-- Select a Category --</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Create Offer'}
      </button>
    </form>
  );
}

export function OffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<OfferType>('service_offer');

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/offers?type=${viewType}`);
        if (!response.ok) {
          throw new Error(`Network response was not ok for type: ${viewType}`);
        }
        const data: Offer[] = await response.json();
        setOffers(data);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [viewType]);

  const handleOfferCreated = (createdType: OfferType) => {
    setViewType(createdType);
  };

  return (
    <div className="page-container">
      <div className="view-toggle">
        <button 
          onClick={() => setViewType('service_offer')} 
          className={viewType === 'service_offer' ? 'active' : ''}>
          Masters' Offers
        </button>
        <button 
          onClick={() => setViewType('request_for_service')} 
          className={viewType === 'request_for_service' ? 'active' : ''}>
          Clients' Requests
        </button>
      </div>

      <h1>{viewType === 'service_offer' ? "Masters' Offers" : "Clients' Requests"}</h1>
      
      {user && <CreateOfferForm onOfferCreated={handleOfferCreated} />}

      {loading && <p>Loading...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {!loading && !error && (
        <div className="offers-list">
          {offers.length > 0 ? (
            offers.map(offer => (
              <div key={offer.id} className="offer-card">
                <h2>{offer.title}</h2>
                <p>{offer.description}</p>
                <footer>
                  <span>From: {offer.authorFirstName}</span>
                  <span>Posted: {new Date(offer.createdAt).toLocaleDateString()}</span>
                </footer>
              </div>
            ))
          ) : (
            <p>No offers found for this category.</p>
          )}
        </div>
      )}
    </div>
  );
}