import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
}

interface CategoryEditModalProps {
  category: ServiceCategory | null;
  onSave: (category: ServiceCategory) => void;
  onClose: () => void;
}

export function CategoryEditModal({ category, onSave, onClose }: CategoryEditModalProps) {
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
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{isNew ? t('adminPage.modals.addCategoryTitle') : t('adminPage.modals.editCategoryTitle')}</h3>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>{t('adminPage.categoryTable.name')}:</label>
            <input
              type="text"
              value={editedCategory.name}
              onChange={(e) => setEditedCategory({ ...editedCategory, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>{t('adminPage.categoryTable.description')}:</label>
            <textarea
              value={editedCategory.description}
              onChange={(e) => setEditedCategory({ ...editedCategory, description: e.target.value })}
            />
          </div>
          <div className="modal-actions">
            <button type="submit">{t('adminPage.buttons.save')}</button>
            <button type="button" onClick={onClose}>{t('adminPage.buttons.cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
