import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void; // Переименовано с onCancel для соответствия API MUI
}

export function ConfirmDeleteModal({ open, title, message, onConfirm, onClose }: ConfirmDeleteModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description" dangerouslySetInnerHTML={{ __html: message }} />
      </DialogContent>
      <DialogActions sx={{ p: '0 24px 20px' }}>
        <Button onClick={onClose} color="primary">
          {t('adminPage.buttons.cancel', 'Отмена')}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          {t('adminPage.buttons.delete', 'Удалить')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
