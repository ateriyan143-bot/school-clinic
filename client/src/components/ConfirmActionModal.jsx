import { AlertCircle, X } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onClose
}) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl border border-primary-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle size={20} className="text-accent-500" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-gray-700">{message}</p>
        </div>

        <div className="px-5 py-4 border-t border-primary-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
