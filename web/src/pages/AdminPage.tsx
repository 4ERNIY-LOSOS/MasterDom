import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, CircularProgress, Alert, Snackbar } from '@mui/material';

import { AdminStats } from '../components/admin/AdminStats';
import { UserTable } from '../components/admin/UserTable';
import { OfferTable } from '../components/admin/OfferTable';
import { CategoryTable } from '../components/admin/CategoryTable';
import { UserEditModal } from '../components/admin/UserEditModal';
import { ConfirmDeleteModal } from '../components/admin/ConfirmDeleteModal';
import { CategoryEditModal } from '../components/admin/CategoryEditModal';

// --- Interfaces ---
interface UserDetail { id: string; email: string; role: string; firstName: string; lastName: string | null; isAdmin: boolean; }
interface AdminOfferResponse { id: string; title: string; authorFirstName: string; authorEmail: string; isActive: boolean; }
interface ServiceCategory { id: number; name: string; description: string; }
interface AdminStatsData { totalUsers: number; totalOffers: number; totalJobs: number; totalServiceRequests: number; totalServiceOffers: number; }

export function AdminPage() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // --- State ---
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [offers, setOffers] = useState<AdminOfferResponse[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  // Modals State
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserDetail | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<AdminOfferResponse | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategory | null>(null);

  // --- Data Fetching ---
  const fetchData = async () => {
    // setLoading(true); // No need to set loading true on every refetch, only initial
    try {
      const [statsRes, usersRes, offersRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/offers', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (!statsRes.ok || !usersRes.ok || !offersRes.ok || !categoriesRes.ok) throw new Error('Failed to fetch admin data');
      
      const statsData = await statsRes.json();
      const usersData = (await usersRes.json()).map((u: any) => ({ ...u, isAdmin: u.role === 'admin' }));
      const offersData = await offersRes.json();
      const categoriesData = await categoriesRes.json();

      setStats(statsData);
      setUsers(usersData);
      setOffers(offersData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !user.isAdmin) navigate('/');
    else if (user && token) fetchData();
  }, [user, token, navigate]);

  // --- Handlers ---
  const handleApiResponse = async (response: Response, successMessage: string) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Operation failed' }));
      throw new Error(errorData.details || errorData.error);
    }
    setNotification({ message: successMessage, severity: 'success' });
    fetchData();
  };

  const handleUpdateUser = async (updatedUser: UserDetail) => {
    try {
      const response = await fetch(`/api/admin/users/${updatedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isAdmin: updatedUser.isAdmin, firstName: updatedUser.firstName, lastName: updatedUser.lastName }),
      });
      await handleApiResponse(response, t('adminPage.notifications.userUpdated'));
    } catch (err) {
      setNotification({ message: err instanceof Error ? err.message : 'Error', severity: 'error' });
    } finally {
      setEditingUser(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      await handleApiResponse(response, t('adminPage.notifications.userDeleted'));
    } catch (err) {
      setNotification({ message: err instanceof Error ? err.message : 'Error', severity: 'error' });
    } finally {
      setUserToDelete(null);
    }
  };
  
  const confirmDeleteOffer = async () => {
    if (!offerToDelete) return;
    try {
      const response = await fetch(`/api/admin/offers/${offerToDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      await handleApiResponse(response, t('adminPage.notifications.offerDeleted'));
    } catch (err) {
      setNotification({ message: err instanceof Error ? err.message : 'Error', severity: 'error' });
    } finally {
      setOfferToDelete(null);
    }
  };

  const handleSaveCategory = async (category: ServiceCategory) => {
    const isNew = !category.id;
    const url = isNew ? '/api/admin/categories' : `/api/admin/categories/${category.id}`;
    const method = isNew ? 'POST' : 'PATCH';
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: category.name, description: category.description }),
      });
      await handleApiResponse(response, isNew ? t('adminPage.notifications.categoryCreated') : t('adminPage.notifications.categoryUpdated'));
    } catch (err) {
      setNotification({ message: err instanceof Error ? err.message : 'Error', severity: 'error' });
    } finally {
      setEditingCategory(null);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      const response = await fetch(`/api/admin/categories/${categoryToDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      await handleApiResponse(response, t('adminPage.notifications.categoryDeleted'));
    } catch (err) {
      setNotification({ message: err instanceof Error ? err.message : 'Error', severity: 'error' });
    } finally {
      setCategoryToDelete(null);
    }
  };

  const handleToggleOfferStatus = async (offer: AdminOfferResponse) => {
    try {
      const response = await fetch(`/api/admin/offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      await handleApiResponse(response, t('adminPage.notifications.offerStatusChanged'));
    } catch (err) {
      setNotification({ message: err instanceof Error ? err.message : 'Error', severity: 'error' });
    }
  };

  // --- JSX ---
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>{t('adminPage.title')}</Typography>
      
      <AdminStats stats={stats} />
      
      <UserTable users={users} onEdit={setEditingUser} onDelete={setUserToDelete} currentUser={user} />
      
      <OfferTable offers={offers} onToggleStatus={handleToggleOfferStatus} onDelete={setOfferToDelete} />
      
      <CategoryTable categories={categories} onEdit={setEditingCategory} onDelete={setCategoryToDelete} onAddNew={() => setEditingCategory({ id: 0, name: '', description: '' })} />

      {/* Modals */}
      <UserEditModal open={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser} onSave={handleUpdateUser} currentUserId={user?.userId} />
      <ConfirmDeleteModal open={!!userToDelete} onClose={() => setUserToDelete(null)} onConfirm={confirmDeleteUser} title={t('adminPage.modals.deleteUserTitle')} message={t('adminPage.modals.deleteUserText', { email: userToDelete?.email })} />
      <ConfirmDeleteModal open={!!offerToDelete} onClose={() => setOfferToDelete(null)} onConfirm={confirmDeleteOffer} title={t('adminPage.modals.deleteOfferTitle')} message={t('adminPage.modals.deleteOfferText', { title: offerToDelete?.title })} />
      <CategoryEditModal open={!!editingCategory} onClose={() => setEditingCategory(null)} onSave={handleSaveCategory} category={editingCategory} />
      <ConfirmDeleteModal open={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} onConfirm={confirmDeleteCategory} title={t('adminPage.modals.deleteCategoryTitle')} message={t('adminPage.modals.deleteCategoryText', { name: categoryToDelete?.name })} />

      {/* Notification Snackbar */}
      <Snackbar open={!!notification} autoHideDuration={6000} onClose={() => setNotification(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setNotification(null)} severity={notification?.severity || 'info'} variant="filled" sx={{ width: '100%' }}>
          {notification?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}