import { useState, useEffect } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

export default function DeleteStudentModal({ student, isDeleting, onClose, onConfirm }) {
  const [step, setStep] = useState(1)
  const [nameConfirmation, setNameConfirmation] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (student) {
      setStep(1)
      setNameConfirmation('')
      setAcknowledged(false)
    }
  }, [student])

  if (!student) return null

  const canDelete = acknowledged && nameConfirmation.trim() === student.full_name

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={22} />
            Delete Student Record
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isDeleting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {step === 1 ? (
            <>
              <p className="text-gray-800">
                You are about to permanently delete this student:
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="text-sm text-gray-700">
                  <div><span className="font-medium">Full Name:</span> {student.full_name}</div>
                  <div><span className="font-medium">Grade/Section:</span> {student.grade_level} - {student.section}</div>
                </div>
              </div>
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                This will also delete all related clinic visit records for this student.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-800">
                Final confirmation required.
              </p>
              <label className="label">
                Type the full student name to confirm deletion
              </label>
              <input
                type="text"
                className="input-field"
                value={nameConfirmation}
                onChange={(e) => setNameConfirmation(e.target.value)}
                placeholder={student.full_name}
                disabled={isDeleting}
              />
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  disabled={isDeleting}
                />
                <span>I understand this action is permanent and cannot be undone.</span>
              </label>
            </>
          )}
        </div>

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
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              disabled={isDeleting}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
              disabled={!canDelete || isDeleting}
            >
              <Trash2 size={16} />
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
