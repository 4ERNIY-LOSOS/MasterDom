import { useTranslation } from 'react-i18next';

interface Offer {
  id: string;
  title: string;
  description: string;
  offerType: string;
  createdAt: string;
  authorFirstName: string;
}

interface OfferListProps {
  offers: Offer[];
  loading: boolean;
  error: string | null;
}

export function OfferList({ offers, loading, error }: OfferListProps) {
  const { t } = useTranslation();

  if (loading) {
    return <p>{t('offersPage.loading')}</p>;
  }

  if (error) {
    return <p className="error-message">{t('loginPage.errorPrefix')}: {error}</p>;
  }

  return (
    <div className="offers-list">
      {offers.length > 0 ? (
        offers.map(offer => (
          <div key={offer.id} className="offer-card">
            <h2>{offer.title}</h2>
            <p>{offer.description}</p>
            <footer>
              <span>{t('offersPage.postedBy')} {offer.authorFirstName}</span>
              <span>{t('offersPage.postedDate')} {new Date(offer.createdAt).toLocaleDateString()}</span>
            </footer>
          </div>
        ))
      ) : (
        <p>{t('offersPage.noOffers')}</p>
      )}
    </div>
  );
}
