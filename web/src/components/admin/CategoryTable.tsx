import { useTranslation } from 'react-i18next';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          {t('adminPage.categoryManagementTitle')}
        </Typography>
        <Button variant="contained" onClick={onAddNew}>
          {t('adminPage.buttons.addNewCategory')}
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>{t('adminPage.categoryTable.id')}</TableCell>
              <TableCell>{t('adminPage.categoryTable.name')}</TableCell>
              <TableCell>{t('adminPage.categoryTable.description')}</TableCell>
              <TableCell align="right">{t('adminPage.categoryTable.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell component="th" scope="row">
                  {cat.id}
                </TableCell>
                <TableCell>{cat.name}</TableCell>
                <TableCell>{cat.description}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => onEdit(cat)} sx={{ mr: 1 }}>
                    {t('adminPage.buttons.edit')}
                  </Button>
                  <Button size="small" color="error" onClick={() => onDelete(cat)}>
                    {t('adminPage.buttons.delete')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
