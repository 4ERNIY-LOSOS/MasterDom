import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface UserDetail {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string | null;
  isAdmin: boolean;
}

interface UserEditModalProps {
  user: UserDetail | null;
  currentUserId: string | undefined;
  onSave: (user: UserDetail) => void;
  onClose: () => void;
}

export function UserEditModal({ user, currentUserId, onSave, onClose }: UserEditModalProps) {
  const { t } = useTranslation();
  const [editedUser, setEditedUser] = useState<UserDetail | null>(user);

  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  if (!editedUser) {
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedUser);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{t('adminPage.modals.editUserTitle', { email: editedUser.email })}</h3>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              value={editedUser.firstName || ''}
              onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              value={editedUser.lastName || ''}
              onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value || null })}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={editedUser.isAdmin}
                onChange={(e) => setEditedUser({ ...editedUser, isAdmin: e.target.checked })}
                disabled={currentUserId === editedUser.id || editedUser.email === 'admin@gmail.com'}
              />
              Is Admin
            </label>
          </div>
          <div className="modal-actions">
            <button type="submit">{t('adminPage.buttons.saveChanges')}</button>
            <button type="button" onClick={onClose}>{t('adminPage.buttons.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
