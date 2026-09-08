export default function ConfirmDialog({ open, title, description, confirmLabel = 'Törlés', onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="delete-modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onClick={(event) => event.stopPropagation()}>
        <div className="delete-modal-icon" aria-hidden="true">!</div>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{description}</p>
        <div className="delete-modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>Mégse</button>
          <button type="button" className="delete-confirm-button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
