import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { OfferList } from '../components/OfferList';

interface Offer {
  id: string;
  title: string;
  description: string;
  offerType: string;
  createdAt: string;
  authorFirstName: string;
}

export function HomePage() {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/offers'); // No type filter to get all offers
        if (!response.ok) throw new Error('Network response was not ok');
        const data: Offer[] = await response.json();
        setOffers(data);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
        else setError('An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  return (
    <div className="page-container">
      <h1>{t('homePage.welcome')}</h1>
      <p>{t('homePage.loggedOut')}</p> {/* This can be improved later */}
      
      <h2>{t('homePage.latestOffers')}</h2>
      <OfferList offers={offers} loading={loading} error={error} />
    </div>
  );
}
