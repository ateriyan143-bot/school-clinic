import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, X, KeyRound } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import ConfirmActionModal from '../components/ConfirmActionModal'
import DeleteAccountModal from '../components/DeleteAccountModal'
import { useAuth } from '../contexts/AuthContext'

export default function AdminAccounts() {
  const { user, getToken, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [accounts, setAccounts] = useState([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [revealingPasswordId, setRevealingPasswordId] = useState(null)
  const [revealedPasswords, setRevealedPasswords] = useState({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [editAccountId, setEditAccountId] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    dob: '',
    address: '',
    email: '',
    password: '',
    role: 'Nurse'
  })
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    dob: '',
    address: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setAccountsLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })

      const data = await response.json().catch(() => [])
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load accounts')
      }

      setAccounts(data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setErrorMessage(error.message || 'Failed to load accounts')
    } finally {
      setAccountsLoading(false)
    }
  }

  const handleChange = (e) => {
    setErrorMessage('')
    setSuccessMessage('')

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleEditChange = (e) => {
    setErrorMessage('')
    setSuccessMessage('')

    setEditFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const canManageAccount = (account) => {
    if (!user || user.role !== 'Admin') return false
    return account.role === 'Nurse' || account.id === user.id
  }

  const handleRevealNursePassword = async (account) => {
    if (!account || account.role !== 'Nurse') {
      setErrorMessage('Only nurse account passwords can be viewed.')
      return
    }

    setRevealingPasswordId(account.id)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/admin/users/${account.id}/reveal-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to reveal password')
        return
      }

      setRevealedPasswords((prev) => ({
        ...prev,
        [account.id]: data.temporaryPassword || ''
      }))
      setSuccessMessage(`Password reset and revealed for ${getFullName(account)}.`)
    } catch (error) {
      console.error('Error revealing password:', error)
      setErrorMessage('Failed to reveal password. Please try again.')
    } finally {
      setRevealingPasswordId(null)
    }
  }

  const getFullName = (account) => [account.first_name, account.middle_name, account.last_name].filter(Boolean).join(' ')

  const openEditModal = (account) => {
    if (!canManageAccount(account)) {
      setErrorMessage('You can only edit nurse accounts and your own account.')
      return
    }

    setEditAccountId(account.id)
    setEditFormData({
      first_name: account.first_name || '',
      middle_name: account.middle_name || '',
      last_name: account.last_name || '',
      dob: account.dob ? account.dob.substring(0, 10) : '',
      address: account.address || '',
      email: account.email || '',
      password: ''
    })
    setShowEditPassword(false)
  }

  const closeEditModal = () => {
    if (editLoading) return
    setShowEditPassword(false)
    setEditAccountId(null)
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!validateAge(editFormData.dob)) {
      setErrorMessage('Date of birth is invalid. Account holder must be at least 20 years old.')
      return
    }

    setEditLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${editAccountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(editFormData)
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to update account')
        return
      }

      if (data.token && data.user) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      setSuccessMessage('Account updated successfully.')
      setEditAccountId(null)
      fetchAccounts()
    } catch (error) {
      console.error('Error updating account:', error)
      setErrorMessage('Failed to update account. Please try again.')
    } finally {
      setEditLoading(false)
    }
  }

  const openDeleteModal = (account) => {
    if (!canManageAccount(account)) {
      setErrorMessage('You can only delete nurse accounts and your own account.')
      return
    }

    setDeleteTarget(account)
  }

  const confirmDeleteAccount = async () => {
    if (!deleteTarget) return

    setDeleteLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const deletingOwnAccount = deleteTarget.id === user?.id
      const response = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setErrorMessage(data.error || 'Failed to delete account')
        return
      }

      setDeleteTarget(null)

      if (deletingOwnAccount) {
        logout()
        return
      }

      setSuccessMessage('Account deleted successfully.')
      fetchAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      setErrorMessage('Failed to delete account. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const validateAge = (dob) => {
    const birthDate = new Date(dob)
    if (Number.isNaN(birthDate.getTime())) return false

    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1
    }

    return age >= 20
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!validateAge(formData.dob)) {
      setErrorMessage('Date of birth is invalid. Account holder must be at least 20 years old.')
      return
    }

    setShowConfirm(true)
  }

  const confirmCreateAccount = async () => {
    setShowConfirm(false)
    setLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to create account')
        return
      }

      setSuccessMessage(`Successfully created ${data.role} account for ${data.first_name} ${data.last_name}.`)
      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        dob: '',
        address: '',
        email: '',
        password: '',
        role: 'Nurse'
      })
      setShowCreateModal(false)
      fetchAccounts()
    } catch (error) {
      console.error('Error creating account:', error)
      setErrorMessage('Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto pl-0 lg:pl-0">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Administrator Accounts</h1>
              <p className="text-gray-600 text-sm sm:text-base">Create and manage nurse and admin accounts.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 sm:px-4 py-2 sm:py-2.5 text-white hover:bg-primary-700 transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              <Plus size={18} />
              Add New Account
            </button>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <div className="card border-2 border-primary-600">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Accounts List</h2>
              <button
                type="button"
                onClick={fetchAccounts}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Refresh
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Admins can edit or delete nurse accounts and their own account only.</p>

            {accountsLoading ? (
              <p className="text-sm text-gray-500">Loading accounts...</p>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-gray-500">No accounts found.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-primary-200">
                <table className="w-full">
                  <thead className="bg-primary-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Password</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Created Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {accounts.map((account) => (
                      <tr key={account.id} className="bg-white hover:bg-primary-50/50 transition-colors">
                        <td className="px-4 py-3.5 text-sm font-medium text-gray-900">{getFullName(account)}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-900">{account.role}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-900">{account.email}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-900 font-mono">
                          {account.role === 'Nurse'
                            ? (revealedPasswords[account.id] || '••••••••••')
                            : 'Hidden'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-900">{new Date(account.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-900">
                          {canManageAccount(account) ? (
                            <div className="flex items-center gap-2">
                              {account.role === 'Nurse' && (
                                <button
                                  type="button"
                                  onClick={() => handleRevealNursePassword(account)}
                                  className="inline-flex items-center justify-center w-9 h-9 rounded border border-amber-500 text-amber-600 hover:bg-amber-50 transition-colors"
                                  title="Reveal password (resets to temporary password)"
                                  disabled={revealingPasswordId === account.id}
                                >
                                  <KeyRound size={16} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openEditModal(account)}
                                className="inline-flex items-center justify-center w-9 h-9 rounded border border-primary-500 text-primary-600 hover:bg-primary-50 transition-colors"
                                title="Edit account"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteModal(account)}
                                className="inline-flex items-center justify-center w-9 h-9 rounded border border-red-500 text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete account"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">Not allowed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg w-full max-w-4xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Account</h3>
              <button
                onClick={() => {
                  if (!loading) setShowCreateModal(false)
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">First Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="first_name"
                      className="input-field"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Middle Name</label>
                    <input
                      type="text"
                      name="middle_name"
                      className="input-field"
                      value={formData.middle_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="label">Last Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="last_name"
                      className="input-field"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Date of Birth <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="dob"
                    className="input-field"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be 20 years old or above.</p>
                </div>
                <div>
                  <label className="label">Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="address"
                    className="input-field"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Credentials</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Role <span className="text-red-500">*</span></label>
                    <select
                      name="role"
                      className="input-field"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="Nurse">Nurse</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      name="email"
                      className="input-field"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Password <span className="text-red-500">*</span></label>
                    <input
                      type={showCreatePassword ? 'text' : 'password'}
                      name="password"
                      className="input-field"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={6}
                      required
                    />
                    <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={showCreatePassword}
                        onChange={(e) => setShowCreatePassword(e.target.checked)}
                      />
                      Show password
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    if (!loading) setShowCreateModal(false)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-6"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editAccountId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Account</h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={editLoading}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitEdit} className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="first_name"
                    className="input-field"
                    value={editFormData.first_name}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div>
                  <label className="label">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    className="input-field"
                    value={editFormData.middle_name}
                    onChange={handleEditChange}
                  />
                </div>
                <div>
                  <label className="label">Last Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="last_name"
                    className="input-field"
                    value={editFormData.last_name}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Date of Birth <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="dob"
                    className="input-field"
                    value={editFormData.dob}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div>
                  <label className="label">Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="address"
                    className="input-field"
                    value={editFormData.address}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  name="password"
                  className="input-field"
                  value={editFormData.password}
                  onChange={handleEditChange}
                  minLength={6}
                  placeholder="Leave blank to keep current password"
                />
                <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={showEditPassword}
                    onChange={(e) => setShowEditPassword(e.target.checked)}
                  />
                  Show password
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:bg-gray-400"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmActionModal
        isOpen={showConfirm}
        title="Confirm Account Creation"
        message={`Create a new ${formData.role} account for ${formData.first_name} ${formData.last_name}?`}
        confirmLabel="Yes, Create"
        isLoading={loading}
        onConfirm={confirmCreateAccount}
        onClose={() => setShowConfirm(false)}
      />

      <DeleteAccountModal
        account={deleteTarget}
        isDeleting={deleteLoading}
        onConfirm={confirmDeleteAccount}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
      />
    </div>
  )
}
