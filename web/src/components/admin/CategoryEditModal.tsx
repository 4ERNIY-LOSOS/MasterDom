import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
}

interface CategoryEditModalProps {
  open: boolean;
  category: ServiceCategory | null;
  onSave: (category: ServiceCategory) => void;
  onClose: () => void;
}

export function CategoryEditModal({ open, category, onSave, onClose }: CategoryEditModalProps) {
  const { t } = useTranslation();
  const [editedCategory, setEditedCategory] = useState<ServiceCategory | null>(category);

  useEffect(() => {
    setEditedCategory(category);
  }, [category]);

  if (!editedCategory) {
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedCategory);
  };

  const isNew = !editedCategory.id;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isNew ? t('adminPage.modals.addCategoryTitle') : t('adminPage.modals.editCategoryTitle')}</DialogTitle>
      <DialogContent>
        <form id="category-edit-form" onSubmit={handleSave}>
          <TextField
            autoFocus
            margin="dense"
            label={t('adminPage.categoryTable.name')}
            type="text"
            fullWidth
            variant="outlined"
            value={editedCategory.name}
            onChange={(e) => setEditedCategory({ ...editedCategory, name: e.target.value })}
            required
          />
          <TextField
            margin="dense"
            label={t('adminPage.categoryTable.description')}
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={editedCategory.description}
            onChange={(e) => setEditedCategory({ ...editedCategory, description: e.target.value })}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('adminPage.buttons.cancel')}</Button>
        <Button type="submit" form="category-edit-form" variant="contained">
          {t('adminPage.buttons.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
