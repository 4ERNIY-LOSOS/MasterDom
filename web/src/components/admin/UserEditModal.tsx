import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControlLabel, Checkbox } from '@mui/material';

interface UserDetail {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string | null;
  isAdmin: boolean;
}

interface UserEditModalProps {
  open: boolean;
  user: UserDetail | null;
  currentUserId: string | undefined;
  onSave: (user: UserDetail) => void;
  onClose: () => void;
}

export function UserEditModal({ open, user, currentUserId, onSave, onClose }: UserEditModalProps) {
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('adminPage.modals.editUserTitle', { email: editedUser.email })}</DialogTitle>
      <DialogContent>
        <form id="user-edit-form" onSubmit={handleSave}>
          <TextField
            autoFocus
            margin="dense"
            label={t('adminPage.modals.firstNameLabel')}
            type="text"
            fullWidth
            variant="outlined"
            value={editedUser.firstName || ''}
            onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
          />
          <TextField
            margin="dense"
            label={t('adminPage.modals.lastNameLabel')}
            type="text"
            fullWidth
            variant="outlined"
            value={editedUser.lastName || ''}
            onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value || null })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={editedUser.isAdmin}
                onChange={(e) => setEditedUser({ ...editedUser, isAdmin: e.target.checked })}
                disabled={currentUserId === editedUser.id || editedUser.email === 'admin@gmail.com'}
              />
            }
            label={t('adminPage.modals.isAdminLabel')}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('adminPage.buttons.cancel')}</Button>
        <Button type="submit" form="user-edit-form" variant="contained">
          {t('adminPage.buttons.saveChanges')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
