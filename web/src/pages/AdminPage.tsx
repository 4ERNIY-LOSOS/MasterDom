import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// --- Interfaces ---
interface UserDetail {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string | null;
  phoneNumber: string | null;
  bio: string | null;
  yearsOfExperience: number | null;
  averageRating: number;
  isAdmin: boolean; // Derived on frontend
  createdAt: string;
  updatedAt: string;
}

interface AdminOfferResponse {
  id: string;
  title: string;
  description: string;
  offerType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorFirstName: string;
  authorEmail: string;
}

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
}

interface AdminStats {
  totalUsers: number;
  totalOffers: number;
  totalJobs: number;
  totalServiceRequests: number;
  totalServiceOffers: number;
}

export function AdminPage() {
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
      <h1>Admin Panel</h1>

      <section><h2>Dashboard</h2>{stats ? <div className="stats-grid"><div className="stat-card"><h3>Total Users</h3><p>{stats.totalUsers}</p></div><div className="stat-card"><h3>Total Offers</h3><p>{stats.totalOffers}</p></div><div className="stat-card"><h3>Total Jobs</h3><p>{stats.totalJobs}</p></div><div className="stat-card"><h3>Service Requests</h3><p>{stats.totalServiceRequests}</p></div><div className="stat-card"><h3>Service Offers</h3><p>{stats.totalServiceOffers}</p></div></div> : <p>Loading stats...</p>}</section>

      <section><h2>User Management</h2>{users.length === 0 ? <p>No users found.</p> : <table><thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Admin</th><th>Actions</th></tr></thead><tbody>{users.map((u) => (<tr key={u.id}><td>{u.email}</td><td>{u.firstName} {u.lastName || ''}</td><td>{u.role}</td><td><input type="checkbox" checked={u.isAdmin} disabled /></td><td><button onClick={() => { setEditingUser(u); setShowEditModal(true); }}>Edit</button><button onClick={() => { setUserToDelete(u); setShowDeleteConfirm(true); }} disabled={user?.userId === u.id} className="delete-button">Delete</button></td></tr>))}</tbody></table>}</section>

      <section><h2>Offer Management</h2>{offers.length === 0 ? <p>No offers found.</p> : <table><thead><tr><th>Title</th><th>Author</th><th>Status</th><th>Actions</th></tr></thead><tbody>{offers.map((o) => (<tr key={o.id}><td>{o.title}</td><td>{o.authorFirstName} ({o.authorEmail})</td><td><span className={o.isActive ? 'status-active' : 'status-inactive'}>{o.isActive ? 'Active' : 'Inactive'}</span></td><td><button onClick={async () => { await fetch(`/api/admin/offers/${o.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ isActive: !o.isActive }) }); fetchData(); }}>{o.isActive ? 'Deactivate' : 'Activate'}</button><button onClick={() => { setOfferToDelete(o); setShowOfferDeleteConfirm(true); }} className="delete-button">Delete</button></td></tr>))}</tbody></table>}</section>

      <section><h2>Category Management</h2><button onClick={() => { setEditingCategory({ id: 0, name: '', description: '' }); setShowCategoryModal(true); }}>Add New Category</button><table><thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead><tbody>{categories.map((cat) => (<tr key={cat.id}><td>{cat.id}</td><td>{cat.name}</td><td>{cat.description}</td><td><button onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }}>Edit</button><button onClick={() => handleDeleteCategoryRequest(cat)} className="delete-button">Delete</button></td></tr>))}</tbody></table></section>

      {/* Modals */}
      {showEditModal && editingUser && <div className="modal-overlay"><div className="modal-content"><h3>Edit User: {editingUser.email}</h3><form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(editingUser); }}><div className="form-group"><label>First Name:</label><input type="text" value={editingUser.firstName || ''} onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })} /></div><div className="form-group"><label>Last Name:</label><input type="text" value={editingUser.lastName || ''} onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value || null })} /></div><div className="form-group"><label><input type="checkbox" checked={editingUser.isAdmin} onChange={(e) => setEditingUser({ ...editingUser, isAdmin: e.target.checked })} disabled={user?.userId === editingUser.id || editingUser.email === 'admin@gmail.com'} /> Is Admin</label></div><div className="modal-actions"><button type="submit">Save Changes</button><button type="button" onClick={() => setShowEditModal(false)}>Cancel</button></div></form></div></div>}

      {showDeleteConfirm && userToDelete && <div className="modal-overlay"><div className="modal-content"><h3>Confirm Deletion</h3><p>Are you sure you want to delete <strong>{userToDelete.email}</strong>?</p><div className="modal-actions"><button onClick={confirmDeleteUser} className="delete-button">Delete</button><button onClick={() => setShowDeleteConfirm(false)}>Cancel</button></div></div></div>}

      {showOfferDeleteConfirm && offerToDelete && <div className="modal-overlay"><div className="modal-content"><h3>Confirm Deletion</h3><p>Are you sure you want to delete the offer <strong>{offerToDelete.title}</strong>?</p><div className="modal-actions"><button onClick={confirmDeleteOffer} className="delete-button">Delete</button><button onClick={() => setShowOfferDeleteConfirm(false)}>Cancel</button></div></div></div>}

      {showCategoryDeleteConfirm && categoryToDelete && <div className="modal-overlay"><div className="modal-content"><h3>Confirm Deletion</h3><p>Are you sure you want to delete the category <strong>{categoryToDelete.name}</strong>? This might affect existing offers.</p><div className="modal-actions"><button onClick={confirmDeleteCategory} className="delete-button">Delete</button><button onClick={() => setShowCategoryDeleteConfirm(false)}>Cancel</button></div></div></div>}

      {showCategoryModal && editingCategory && <div className="modal-overlay"><div className="modal-content"><h3>{editingCategory.id ? 'Edit' : 'Add'} Category</h3><form onSubmit={(e) => { e.preventDefault(); handleSaveCategory(editingCategory); }}><div className="form-group"><label>Name:</label><input type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} required /></div><div className="form-group"><label>Description:</label><textarea value={editingCategory.description} onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })} /></div><div className="modal-actions"><button type="submit">Save</button><button type="button" onClick={() => setShowCategoryModal(false)}>Cancel</button></div></form></div></div>}
    </div>
  );
}