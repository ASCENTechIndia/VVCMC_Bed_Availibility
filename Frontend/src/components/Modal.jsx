import React from 'react';

/**
 * Reusable modal dialog for alert messages and confirmations
 */
export default function Modal({
  isOpen,
  type = 'success', // 'success' | 'confirm' | 'warning'
  title = 'Success',
  message = '',
  onOk,
  okText = 'OK',
  showCancel = false,
  onCancel,
  cancelText = 'Cancel',
  confirmLoading = false,
}) {
  if (!isOpen) return null;

  const isWarningOrConfirm = type === 'confirm' || type === 'warning';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirmLoading) {
          if (showCancel && typeof onCancel === 'function') {
            onCancel();
          } else if (typeof onOk === 'function') {
            onOk();
          }
        }
      }}
    >
      <div
        className="modal-box"
        style={
          isWarningOrConfirm
            ? { borderTopColor: 'var(--bad, #d32f2f)' }
            : { borderTopColor: 'var(--ok, #1b8a3a)' }
        }
      >
        <div className="modal-icon">
          {isWarningOrConfirm ? (
            <svg
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--bad, #d32f2f)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ok, #1b8a3a)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div
          className="modal-actions"
          style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
        >
          {showCancel && (
            <button
              type="button"
              className="btn g2 modal-btn"
              onClick={onCancel}
              disabled={confirmLoading}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className={`btn ${isWarningOrConfirm ? 'd' : 'y'} modal-btn`}
            onClick={onOk}
            disabled={confirmLoading}
            autoFocus
          >
            {confirmLoading ? 'Processing...' : okText}
          </button>
        </div>
      </div>
    </div>
  );
}
