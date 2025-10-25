import { useTranslation } from 'react-i18next';

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
}

interface CategoryTableProps {
  categories: ServiceCategory[];
  onEdit: (category: ServiceCategory) => void;
  onDelete: (category: ServiceCategory) => void;
  onAddNew: () => void;
}

export function CategoryTable({ categories, onEdit, onDelete, onAddNew }: CategoryTableProps) {
  const { t } = useTranslation();

  return (
    <section>
      <h2>{t('adminPage.categoryManagementTitle')}</h2>
      <button onClick={onAddNew}>{t('adminPage.buttons.addNewCategory')}</button>
      <table>
        <thead>
          <tr>
            <th>{t('adminPage.categoryTable.id')}</th>
            <th>{t('adminPage.categoryTable.name')}</th>
            <th>{t('adminPage.categoryTable.description')}</th>
            <th>{t('adminPage.categoryTable.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.id}</td>
              <td>{cat.name}</td>
              <td>{cat.description}</td>
              <td>
                <button onClick={() => onEdit(cat)}>{t('adminPage.buttons.edit')}</button>
                <button onClick={() => onDelete(cat)} className="delete-button">
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
