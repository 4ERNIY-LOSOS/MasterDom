import { useTranslation } from 'react-i18next';

interface AdminStats {
  totalUsers: number;
  totalOffers: number;
  totalJobs: number;
  totalServiceRequests: number;
  totalServiceOffers: number;
}

interface AdminStatsProps {
  stats: AdminStats | null;
}

export function AdminStats({ stats }: AdminStatsProps) {
  const { t } = useTranslation();

  if (!stats) {
    return <p>Loading stats...</p>;
  }

  return (
    <section>
      <h2>{t('adminPage.dashboardTitle')}</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{t('adminPage.stats.totalUsers')}</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>{t('adminPage.stats.totalOffers')}</h3>
          <p>{stats.totalOffers}</p>
        </div>
        <div className="stat-card">
          <h3>{t('adminPage.stats.totalJobs')}</h3>
          <p>{stats.totalJobs}</p>
        </div>
        <div className="stat-card">
          <h3>{t('adminPage.stats.serviceRequests')}</h3>
          <p>{stats.totalServiceRequests}</p>
        </div>
        <div className="stat-card">
          <h3>{t('adminPage.stats.serviceOffers')}</h3>
          <p>{stats.totalServiceOffers}</p>
        </div>
      </div>
    </section>
  );
}
