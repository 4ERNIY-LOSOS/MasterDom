import { useTranslation } from 'react-i18next';
import {
  Typography, Card, CardContent, TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, Checkbox, Button, Box
} from '@mui/material';

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
  currentUser: { userId: string } | null;
  onEdit: (user: UserDetail) => void;
  onDelete: (user: UserDetail) => void;
}

export function UserTable({ users, currentUser, onEdit, onDelete }: UserTableProps) {
  const { t } = useTranslation();

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {t('adminPage.userManagementTitle')}
        </Typography>
        {users.length === 0 ? (
          <Typography>No users found.</Typography>
        ) : (
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('adminPage.userTable.email')}</TableCell>
                  <TableCell>{t('adminPage.userTable.name')}</TableCell>
                  <TableCell>{t('adminPage.userTable.role')}</TableCell>
                  <TableCell align="center">{t('adminPage.userTable.admin')}</TableCell>
                  <TableCell align="right">{t('adminPage.userTable.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.firstName} {u.lastName || ''}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell align="center">
                      <Checkbox checked={u.isAdmin} disabled />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="outlined" onClick={() => onEdit(u)}>
                          {t('adminPage.buttons.edit')}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => onDelete(u)}
                          disabled={currentUser?.userId === u.id}
                        >
                          {t('adminPage.buttons.delete')}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
