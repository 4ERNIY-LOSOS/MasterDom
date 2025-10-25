import { useTranslation } from 'react-i18next';

interface AdminOfferResponse {
  id: string;
  title: string;
  authorFirstName: string;
  authorEmail: string;
  isActive: boolean;
}

interface OfferTableProps {
  offers: AdminOfferResponse[];
  onToggleStatus: (offer: AdminOfferResponse) => void;
  onDelete: (offer: AdminOfferResponse) => void;
}

export function OfferTable({ offers, onToggleStatus, onDelete }: OfferTableProps) {
  const { t } = useTranslation();

  if (offers.length === 0) {
    return <p>No offers found.</p>;
  }

  return (
    <section>
      <h2>{t('adminPage.offerManagementTitle')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('adminPage.offerTable.title')}</th>
            <th>{t('adminPage.offerTable.author')}</th>
            <th>{t('adminPage.offerTable.status')}</th>
            <th>{t('adminPage.offerTable.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((o) => (
            <tr key={o.id}>
              <td>{o.title}</td>
              <td>{o.authorFirstName} ({o.authorEmail})</td>
              <td>
                <span className={o.isActive ? 'status-active' : 'status-inactive'}>
                  {o.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button onClick={() => onToggleStatus(o)}>
                  {o.isActive ? t('adminPage.buttons.deactivate') : t('adminPage.buttons.activate')}
                </button>
                <button onClick={() => onDelete(o)} className="delete-button">
                  {t('adminPage.buttons.delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
