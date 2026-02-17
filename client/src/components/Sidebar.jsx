import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Activity, LayoutDashboard, LogOut, Edit, Save, X, ShieldCheck, Mail, User, MapPin, Calendar, Clock, Menu } from 'lucide-react'

const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024

const loadImageAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(new Error('Failed to read image file'))
  reader.readAsDataURL(file)
})

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, updateUserProfile } = useAuth()
  const [showUserModal, setShowUserModal] = useState(false)
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [userError, setUserError] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userForm, setUserForm] = useState({
    display_name: '',
    role: '',
    email: '',
    profile_image_url: ''
  })

  useEffect(() => {
    setUserForm({
      display_name: user?.display_name || 'Nurse Emma',
      role: user?.role || 'Nurse',
      email: user?.email || '',
      profile_image_url: user?.profile_image_url || ''
    })
  }, [user])

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(user?.role === 'Admin'
      ? [{ path: '/admin/accounts', label: 'Admin Accounts', icon: ShieldCheck }]
      : [])
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleUserFormChange = (e) => {
    if (userError) {
      setUserError('')
    }

    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value
    })
  }

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUserError('Please select a valid image file.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setUserError('Image is too large. Maximum allowed size is 2MB.')
      e.target.value = ''
      return
    }

    try {
      const imageDataUrl = await loadImageAsDataUrl(file)
      setUserError('')
      setUserForm((prev) => ({
        ...prev,
        profile_image_url: imageDataUrl
      }))
    } catch {
      setUserError('Failed to process selected image. Please try another file.')
    } finally {
      e.target.value = ''
    }
  }

  const handleSaveUserInfo = async () => {
    setSavingUser(true)
    setUserError('')

    try {
      await updateUserProfile({
        display_name: userForm.display_name.trim() || 'Nurse Emma',
        role: userForm.role,
        email: userForm.email.trim(),
        profile_image_url: userForm.profile_image_url || null
      })
      setIsEditingUser(false)
      setShowUserModal(false)
    } catch (error) {
      setUserError(error.message || 'Failed to save profile')
    } finally {
      setSavingUser(false)
    }
  }

  const handleCancelUserEdit = () => {
    setUserForm({
      display_name: user?.display_name || 'Nurse Emma',
      role: user?.role || 'Nurse',
      email: user?.email || '',
      profile_image_url: user?.profile_image_url || ''
    })
    setIsEditingUser(false)
    setUserError('')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-white/95 backdrop-blur-sm border-r border-primary-100 flex flex-col shadow-sm
        fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Logo */}
      <div className="p-6 border-b border-primary-100 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm">SCHOOL CLINIC</h2>
            <p className="text-xs text-gray-500">MANAGEMENT SYSTEM</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-primary-100">
        <button
          type="button"
          onClick={() => setShowUserModal(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          {user?.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-primary-300 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-sm font-medium">👤</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.display_name || 'Nurse Emma'}
            </p>
            <p className="text-xs text-gray-500">{user?.role || 'Nurse'}</p>
          </div>
          <Edit size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <li key={item.path}>
                <button
                  onClick={() => {
                    navigate(item.path)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-100 text-primary-800 shadow-sm'
                      : 'text-gray-700 hover:bg-accent-50 hover:text-primary-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-primary-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-accent-50 hover:text-primary-700 rounded-xl transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {showUserModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <div className="flex justify-end p-3 pb-0">
              <button
                type="button"
                onClick={() => {
                  setShowUserModal(false)
                  handleCancelUserEdit()
                }}
                className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {userError && (
              <div className="mx-4 sm:mx-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {userError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row min-h-[400px]">
              {/* Left Panel - Avatar & Name */}
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 sm:w-2/5 border-b sm:border-b-0 sm:border-r border-primary-100 shrink-0">
                {userForm.profile_image_url ? (
                  <img
                    src={userForm.profile_image_url}
                    alt="Profile"
                    className="w-28 h-28 rounded-full border-4 border-primary-400 object-cover mb-4 shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-primary-100 border-4 border-primary-400 flex items-center justify-center text-5xl mb-4 shadow-md">
                    👤
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 text-center">
                  {user?.display_name || 'Nurse Emma'}
                </h3>
                <span className="mt-2 inline-block px-4 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 border border-primary-200">
                  {user?.role || 'Nurse'}
                </span>
              </div>

              {/* Right Panel - Info Cards */}
              <div className="flex-1 p-4 sm:p-8 space-y-6 overflow-y-auto">
                {isEditingUser ? (
                  /* ---- Edit Mode ---- */
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <User size={18} className="text-primary-600" />
                      Edit Information
                    </h4>
                    <div>
                      <label className="label">Name</label>
                      <input
                        type="text"
                        name="display_name"
                        className="input-field"
                        value={userForm.display_name}
                        onChange={handleUserFormChange}
                      />
                    </div>
                    <div>
                      <label className="label">Role</label>
                      <select
                        name="role"
                        className="input-field"
                        value={userForm.role}
                        onChange={handleUserFormChange}
                        disabled={user?.role !== 'Admin'}
                      >
                        <option value="Nurse">Nurse</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        name="email"
                        className="input-field"
                        value={userForm.email}
                        onChange={handleUserFormChange}
                      />
                    </div>
                    <div>
                      <label className="label">Profile Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="input-field"
                        onChange={handleProfileImageChange}
                      />
                      <p className="text-xs text-gray-500 mt-1">Accepted formats: image files up to 2MB.</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelUserEdit}
                        disabled={savingUser}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveUserInfo}
                        disabled={savingUser}
                        className="btn-primary flex items-center gap-1"
                      >
                        <Save size={14} />
                        {savingUser ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ---- View Mode ---- */
                  <>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                        <User size={18} className="text-primary-600" />
                        Personal Information
                      </h4>
                      <p className="text-sm text-gray-500 mb-4">Your account details and information</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                            <Mail size={13} />
                            Email Address
                          </div>
                          <p className="text-sm font-medium text-gray-900">{user?.email || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                            <ShieldCheck size={13} />
                            Role
                          </div>
                          <p className="text-sm font-medium text-gray-900">{user?.role || 'Nurse'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                            <User size={13} />
                            Full Name
                          </div>
                          <p className="text-sm font-medium text-gray-900">{user?.display_name || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                            <MapPin size={13} />
                            Address
                          </div>
                          <p className="text-sm font-medium text-gray-900">{user?.address || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                            <Calendar size={13} />
                            Birthday
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {user?.dob
                              ? new Date(user.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-5">
                      <h4 className="text-base font-bold text-gray-900 mb-3">Account Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-100">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                            <Calendar size={13} />
                            Account Created
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {user?.created_at
                              ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingUser(true)}
                        className="btn-primary flex items-center gap-1.5"
                      >
                        <Edit size={14} />
                        Edit Profile
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    </>
  )
}
