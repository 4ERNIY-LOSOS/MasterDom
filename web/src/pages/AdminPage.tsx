import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

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
interface Stats { totalUsers: number; totalOffers: number; totalJobs: number; totalServiceRequests: number; totalServiceOffers: number; }

export function AdminPage() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // --- State ---
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [offers, setOffers] = useState<AdminOfferResponse[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals State
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: 'user' | 'offer' | 'category', data: any } | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);

  // --- Data Fetching ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes, offersRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/offers', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch stats');
      if (!usersRes.ok) throw new Error('Failed to fetch users');
      if (!offersRes.ok) throw new Error('Failed to fetch offers');
      if (!categoriesRes.ok) throw new Error('Failed to fetch categories');

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
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, token, navigate]);

  // --- API Handlers ---
  const handleUpdateUser = async (updatedUser: UserDetail) => {
    try {
      const response = await fetch(`/api/admin/users/${updatedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isAdmin: updatedUser.isAdmin, firstName: updatedUser.firstName, lastName: updatedUser.lastName }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
        throw new Error(errorData.details || errorData.error);
      }
      fetchData();
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleToggleOfferStatus = async (offer: AdminOfferResponse) => {
    try {
      await fetch(`/api/admin/offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleSaveCategory = async (category: ServiceCategory) => {
    const isNew = !category.id;
    const url = isNew ? '/api/admin/categories' : `/api/admin/categories/${category.id}`;
    const method = isNew ? 'POST' : 'PATCH';
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: category.name, description: category.description }),
      });
      fetchData();
      setEditingCategory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    const { type, data } = deletingItem;
    try {
      await fetch(`/api/admin/${type}s/${data.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setDeletingItem(null);
    }
  };

  // --- Render ---
  if (loading) return <div className="page-container">Loading...</div>;
  if (error) return <div className="page-container">Error: {error}</div>;

  return (
    <div className="page-container">
      <h1>{t('adminPage.title')}</h1>

      <AdminStats stats={stats} />

      <UserTable
        users={users}
        currentUserId={user?.userId}
        onEdit={setEditingUser}
        onDelete={(u) => setDeletingItem({ type: 'user', data: u })}
      />

      <OfferTable
        offers={offers}
        onToggleStatus={handleToggleOfferStatus}
        onDelete={(o) => setDeletingItem({ type: 'offer', data: o })}
      />

      <CategoryTable
        categories={categories}
        onAddNew={() => setEditingCategory({ id: 0, name: '', description: '' })}
        onEdit={setEditingCategory}
        onDelete={(c) => setDeletingItem({ type: 'category', data: c })}
      />

      {/* Modals */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          currentUserId={user?.userId}
          onSave={handleUpdateUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {deletingItem && (
        <ConfirmDeleteModal
          title={t(`adminPage.modals.delete${deletingItem.type.charAt(0).toUpperCase() + deletingItem.type.slice(1)}Title`)}
          message={t(`adminPage.modals.delete${deletingItem.type.charAt(0).toUpperCase() + deletingItem.type.slice(1)}Text`, { name: deletingItem.data.name || deletingItem.data.title || deletingItem.data.email })}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </div>
  );
}
