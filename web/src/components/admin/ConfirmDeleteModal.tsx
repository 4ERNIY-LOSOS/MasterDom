import { useTranslation } from 'react-i18next';

interface ConfirmDeleteModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({ title, message, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <p dangerouslySetInnerHTML={{ __html: message }} />
        <div className="modal-actions">
          <button onClick={onConfirm} className="delete-button">{t('adminPage.buttons.delete')}</button>
          <button onClick={onCancel}>{t('adminPage.buttons.cancel')}</button>
        </div>
      </div>
    </div>
  );
}
