import { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

export default function DeleteAccountModal({ account, isDeleting, onClose, onConfirm }) {
  const [step, setStep] = useState(1)
  const [nameConfirmation, setNameConfirmation] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)

  const getFullName = (acc) =>
    [acc.first_name, acc.middle_name, acc.last_name].filter(Boolean).join(' ')

  useEffect(() => {
    if (account) {
      setStep(1)
      setNameConfirmation('')
      setAcknowledged(false)
    }
  }, [account])

  if (!account) return null

  const fullName = getFullName(account)
  const canDelete = acknowledged && nameConfirmation.trim() === fullName

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={22} />
            Delete Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {step === 1 ? (
            <>
              <p className="text-gray-800">
                You are about to permanently delete this account:
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="text-sm text-gray-700 space-y-1">
                  <div><span className="font-medium">Name:</span> {fullName}</div>
                  <div><span className="font-medium">Email:</span> {account.email}</div>
                  <div><span className="font-medium">Role:</span> {account.role}</div>
                </div>
              </div>
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                This action is irreversible. The account will be permanently removed and the user will no longer be able to log in.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-800">
                Final confirmation required.
              </p>
              <label className="label">
                Type the full name of the account holder to confirm deletion
              </label>
              <input
                type="text"
                className="input-field"
                value={nameConfirmation}
                onChange={(e) => setNameConfirmation(e.target.value)}
                placeholder={fullName}
                disabled={isDeleting}
              />
              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 accent-red-600"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  disabled={isDeleting}
                />
                <span>I understand this action is permanent and cannot be undone.</span>
              </label>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-primary-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex items-center gap-1.5"
            >
              <Trash2 size={15} />
              Continue
            </button>
          ) : (
            <button
              onClick={onConfirm}
              disabled={!canDelete || isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-1.5"
            >
              <Trash2 size={15} />
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
