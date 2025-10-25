import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

// --- Interfaces ---
interface UserDetail { id: string; email: string; role: string; firstName: string; lastName: string | null; phoneNumber: string | null; bio: string | null; yearsOfExperience: number | null; averageRating: number; isAdmin: boolean; createdAt: string; updatedAt: string; }
interface AdminOfferResponse { id: string; title: string; description: string; offerType: string; isActive: boolean; createdAt: string; updatedAt: string; authorId: string; authorFirstName: string; authorEmail: string; }
interface ServiceCategory { id: number; name: string; description: string; }
interface AdminStats { totalUsers: number; totalOffers: number; totalJobs: number; totalServiceRequests: number; totalServiceOffers: number; }

export function AdminPage() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // --- State ---
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [offers, setOffers] = useState<AdminOfferResponse[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals State
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDetail | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<AdminOfferResponse | null>(null);
  const [showOfferDeleteConfirm, setShowOfferDeleteConfirm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategory | null>(null);
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);

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

  // --- Handlers ---
  const handleUpdateUser = async (updatedUser: UserDetail) => {
    try {
      const response = await fetch(`/api/admin/users/${updatedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isAdmin: updatedUser.isAdmin, firstName: updatedUser.firstName, lastName: updatedUser.lastName, phoneNumber: updatedUser.phoneNumber, bio: updatedUser.bio, yearsOfExperience: updatedUser.yearsOfExperience }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Update failed with non-JSON response' }));
        throw new Error(errorData.details || errorData.error || 'Failed to update user');
      }

      fetchData();
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await fetch(`/api/admin/users/${userToDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const confirmDeleteOffer = async () => {
    if (!offerToDelete) return;
    try {
      await fetch(`/api/admin/offers/${offerToDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setShowOfferDeleteConfirm(false);
      setOfferToDelete(null);
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
      setShowCategoryModal(false);
      setEditingCategory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const handleDeleteCategoryRequest = (category: ServiceCategory) => {
    setCategoryToDelete(category);
    setShowCategoryDeleteConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await fetch(`/api/admin/categories/${categoryToDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setShowCategoryDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  };
  
  // --- JSX ---
  if (loading) return <div className="page-container">Loading...</div>;
  if (error) return <div className="page-container">Error: {error}</div>;

  return (
    <div className="page-container">
      <h1>{t('adminPage.title')}</h1>

      <section><h2>{t('adminPage.dashboardTitle')}</h2>{stats ? <div className="stats-grid"><div className="stat-card"><h3>{t('adminPage.stats.totalUsers')}</h3><p>{stats.totalUsers}</p></div><div className="stat-card"><h3>{t('adminPage.stats.totalOffers')}</h3><p>{stats.totalOffers}</p></div><div className="stat-card"><h3>{t('adminPage.stats.totalJobs')}</h3><p>{stats.totalJobs}</p></div><div className="stat-card"><h3>{t('adminPage.stats.serviceRequests')}</h3><p>{stats.totalServiceRequests}</p></div><div className="stat-card"><h3>{t('adminPage.stats.serviceOffers')}</h3><p>{stats.totalServiceOffers}</p></div></div> : <p>Loading stats...</p>}</section>

      <section><h2>{t('adminPage.userManagementTitle')}</h2>{users.length === 0 ? <p>No users found.</p> : <table><thead><tr><th>{t('adminPage.userTable.email')}</th><th>{t('adminPage.userTable.name')}</th><th>{t('adminPage.userTable.role')}</th><th>{t('adminPage.userTable.admin')}</th><th>{t('adminPage.userTable.actions')}</th></tr></thead><tbody>{users.map((u) => (<tr key={u.id}><td>{u.email}</td><td>{u.firstName} {u.lastName || ''}</td><td>{u.role}</td><td><input type="checkbox" checked={u.isAdmin} disabled /></td><td><button onClick={() => { setEditingUser(u); setShowEditModal(true); }}>{t('adminPage.buttons.edit')}</button><button onClick={() => { setUserToDelete(u); setShowDeleteConfirm(true); }} disabled={user?.userId === u.id} className="delete-button">{t('adminPage.buttons.delete')}</button></td></tr>))}</tbody></table>}</section>

      <section><h2>{t('adminPage.offerManagementTitle')}</h2>{offers.length === 0 ? <p>No offers found.</p> : <table><thead><tr><th>{t('adminPage.offerTable.title')}</th><th>{t('adminPage.offerTable.author')}</th><th>{t('adminPage.offerTable.status')}</th><th>{t('adminPage.offerTable.actions')}</th></tr></thead><tbody>{offers.map((o) => (<tr key={o.id}><td>{o.title}</td><td>{o.authorFirstName} ({o.authorEmail})</td><td><span className={o.isActive ? 'status-active' : 'status-inactive'}>{o.isActive ? 'Active' : 'Inactive'}</span></td><td><button onClick={async () => { await fetch(`/api/admin/offers/${o.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ isActive: !o.isActive }) }); fetchData(); }}>{o.isActive ? t('adminPage.buttons.deactivate') : t('adminPage.buttons.activate')}</button><button onClick={() => { setOfferToDelete(o); setShowOfferDeleteConfirm(true); }} className="delete-button">{t('adminPage.buttons.delete')}</button></td></tr>))}</tbody></table>}</section>

      <section><h2>{t('adminPage.categoryManagementTitle')}</h2><button onClick={() => { setEditingCategory({ id: 0, name: '', description: '' }); setShowCategoryModal(true); }}>{t('adminPage.buttons.addNewCategory')}</button><table><thead><tr><th>{t('adminPage.categoryTable.id')}</th><th>{t('adminPage.categoryTable.name')}</th><th>{t('adminPage.categoryTable.description')}</th><th>{t('adminPage.categoryTable.actions')}</th></tr></thead><tbody>{categories.map((cat) => (<tr key={cat.id}><td>{cat.id}</td><td>{cat.name}</td><td>{cat.description}</td><td><button onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }}>{t('adminPage.buttons.edit')}</button><button onClick={() => handleDeleteCategoryRequest(cat)} className="delete-button">{t('adminPage.buttons.delete')}</button></td></tr>))}</tbody></table></section>

      {/* Modals */}
      {showEditModal && editingUser && <div className="modal-overlay"><div className="modal-content"><h3>{t('adminPage.modals.editUserTitle', { email: editingUser.email })}</h3><form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(editingUser); }}><div className="form-group"><label>First Name:</label><input type="text" value={editingUser.firstName || ''} onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })} /></div><div className="form-group"><label>Last Name:</label><input type="text" value={editingUser.lastName || ''} onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value || null })} /></div><div className="form-group"><label><input type="checkbox" checked={editingUser.isAdmin} onChange={(e) => setEditingUser({ ...editingUser, isAdmin: e.target.checked })} disabled={user?.userId === editingUser.id || editingUser.email === 'admin@gmail.com'} /> Is Admin</label></div><div className="modal-actions"><button type="submit">{t('adminPage.buttons.saveChanges')}</button><button type="button" onClick={() => setShowEditModal(false)}>{t('adminPage.buttons.cancel')}</button></div></form></div></div>}

      {showDeleteConfirm && userToDelete && <div className="modal-overlay"><div className="modal-content"><h3>{t('adminPage.modals.deleteUserTitle')}</h3><p dangerouslySetInnerHTML={{ __html: t('adminPage.modals.deleteUserText', { email: userToDelete.email }) }} /><div className="modal-actions"><button onClick={confirmDeleteUser} className="delete-button">{t('adminPage.buttons.delete')}</button><button onClick={() => setShowDeleteConfirm(false)}>{t('adminPage.buttons.cancel')}</button></div></div></div>}

      {showOfferDeleteConfirm && offerToDelete && <div className="modal-overlay"><div className="modal-content"><h3>{t('adminPage.modals.deleteOfferTitle')}</h3><p dangerouslySetInnerHTML={{ __html: t('adminPage.modals.deleteOfferText', { title: offerToDelete.title }) }} /><div className="modal-actions"><button onClick={confirmDeleteOffer} className="delete-button">{t('adminPage.buttons.delete')}</button><button onClick={() => setShowOfferDeleteConfirm(false)}>{t('adminPage.buttons.cancel')}</button></div></div></div>}

      {showCategoryDeleteConfirm && categoryToDelete && <div className="modal-overlay"><div className="modal-content"><h3>{t('adminPage.modals.deleteCategoryTitle')}</h3><p dangerouslySetInnerHTML={{ __html: t('adminPage.modals.deleteCategoryText', { name: categoryToDelete.name }) }} /><div className="modal-actions"><button onClick={confirmDeleteCategory} className="delete-button">{t('adminPage.buttons.delete')}</button><button onClick={() => setShowCategoryDeleteConfirm(false)}>{t('adminPage.buttons.cancel')}</button></div></div></div>}
      
      {showCategoryModal && editingCategory && <div className="modal-overlay"><div className="modal-content"><h3>{editingCategory.id ? t('adminPage.modals.editCategoryTitle') : t('adminPage.modals.addCategoryTitle')}</h3><form onSubmit={(e) => { e.preventDefault(); handleSaveCategory(editingCategory); }}><div className="form-group"><label>{t('adminPage.categoryTable.name')}:</label><input type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} required /></div><div className="form-group"><label>{t('adminPage.categoryTable.description')}:</label><textarea value={editingCategory.description} onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })} /></div><div className="modal-actions"><button type="submit">{t('adminPage.buttons.save')}</button><button type="button" onClick={() => setShowCategoryModal(false)}>{t('adminPage.buttons.cancel')}</button></div></form></div></div>}
    </div>
  );
}