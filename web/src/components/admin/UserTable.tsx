import { useTranslation } from 'react-i18next';

interface UserDetail {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string | null;
  isAdmin: boolean;
}

interface UserTableProps {
  users: UserDetail[];
  currentUserId: string | undefined;
  onEdit: (user: UserDetail) => void;
  onDelete: (user: UserDetail) => void;
}

export function UserTable({ users, currentUserId, onEdit, onDelete }: UserTableProps) {
  const { t } = useTranslation();

  if (users.length === 0) {
    return <p>No users found.</p>;
  }

  return (
    <section>
      <h2>{t('adminPage.userManagementTitle')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('adminPage.userTable.email')}</th>
            <th>{t('adminPage.userTable.name')}</th>
            <th>{t('adminPage.userTable.role')}</th>
            <th>{t('adminPage.userTable.admin')}</th>
            <th>{t('adminPage.userTable.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.firstName} {u.lastName || ''}</td>
              <td>{u.role}</td>
              <td><input type="checkbox" checked={u.isAdmin} disabled /></td>
              <td>
                <button onClick={() => onEdit(u)}>{t('adminPage.buttons.edit')}</button>
                <button onClick={() => onDelete(u)} disabled={currentUserId === u.id} className="delete-button">
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
