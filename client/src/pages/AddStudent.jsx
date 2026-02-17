import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar'
import ConfirmActionModal from '../components/ConfirmActionModal'
import { ArrowLeft } from 'lucide-react'

const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024

const SECTION_GROUPS = {
  'GRADE 7': ['AGLIPAY', 'BURGOS', 'GOMEZ', 'DELA CRUZ', 'RUIZ', 'ZAMORA', 'CALUNGSOD'],
  'GRADE 8': ['AGUINALDO', 'LAUREL', 'MAGSAYSAY', 'ROXAS', 'OSMEÑA', 'QUEZON', 'QUIRINO'],
  'GRADE 9': ['JAENA', 'HIDALGO', 'LUNA', 'DEL PILAR', 'RIZAL', 'REGIDOR', 'PONCE'],
  'GRADE 10': ['ALVAREZ', 'ARELLANO', 'BONIFACIO', 'MABINI', 'MALVAR', 'JACINTO', 'RINT'],
  'GRADE 11': ['HUMSS-AGONCILLO', '11-ALS', 'HUMSS-SILANG', 'HUMSS-DE JESUS', 'TVL-HE-ESCODA', 'TVL-ICT-DIZON', 'STEM-DEL MUNDO', 'ABM-MAGBANUA'],
  'GRADE 12': ['ABM-RIVERA', 'STEM-AQUINO', 'HUMSS-FERNANDEZ', 'HUMSS-HENSON', 'HUMSS-LEONES', '12-ALS', 'TVL-ICT-BARROS', 'TVL-ICT-VILLAVICENCIO']
}

const getSectionsByGrade = (gradeLevel) => SECTION_GROUPS[`GRADE ${gradeLevel}`] || []

export default function AddStudent() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    grade_level: '',
    section: '',
    sex: '',
    dob: '',
    contact_number: '',
    address: '',
    emergency_contact_person: '',
    emergency_contact_number: '',
    profile_image_url: ''
  })

  const availableSections = getSectionsByGrade(formData.grade_level)

  const handleChange = (e) => {
    if (formError) {
      setFormError('')
    }

    if (e.target.name === 'grade_level') {
      setFormData({
        ...formData,
        grade_level: e.target.value,
        section: ''
      })
      return
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setFormError('Student photo is too large. Please upload an image up to 2MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        profile_image_url: typeof reader.result === 'string' ? reader.result : ''
      }))
    }
    reader.onerror = () => {
      setFormError('Failed to read image file. Please try another file.')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setShowSaveConfirm(true)
  }

  const confirmSaveStudent = async () => {
    setShowSaveConfirm(false)
    setLoading(true)

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        navigate('/dashboard')
      } else {
        const errorData = await response.json().catch(() => ({}))
        setFormError(errorData.error || 'Unable to create student profile. Please review the form and try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      setFormError('Unable to create student profile. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto pl-0 lg:pl-0">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-primary-700 hover:text-primary-900 mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>

          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Student</h1>
              <p className="text-primary-700 mt-2 text-sm sm:text-base">Fill in the student information below.</p>
            </div>

            {formError && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="card space-y-8">
              {/* Student Basic Information */}
              <div>
                <h2 className="text-xl font-semibold text-primary-800 mb-4">Student Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      className="input-field"
                      placeholder="Full Name"
                      value={formData.full_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Student Photo (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="input-field"
                      onChange={handleImageUpload}
                    />
                    {formData.profile_image_url && (
                      <img
                        src={formData.profile_image_url}
                        alt="Student preview"
                        className="mt-2 h-20 w-20 rounded-lg object-cover border border-primary-100"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h2 className="text-xl font-semibold text-primary-800 mb-4">Academic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      Grade Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="grade_level"
                      className="input-field"
                      value={formData.grade_level}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Grade Level</option>
                      {[7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">
                      Section <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="section"
                      className="input-field"
                      value={formData.section}
                      onChange={handleChange}
                      disabled={!formData.grade_level}
                      required
                    >
                      <option value="">{formData.grade_level ? 'Select Section' : 'Select Grade Level First'}</option>
                      {availableSections.map((section) => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold text-primary-800 mb-4">Personal Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      Sex <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sex"
                          value="Male"
                          checked={formData.sex === 'Male'}
                          onChange={handleChange}
                          className="mr-2"
                          required
                        />
                        Male
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sex"
                          value="Female"
                          checked={formData.sex === 'Female'}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        Female
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sex"
                          value="Other"
                          checked={formData.sex === 'Other'}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        Other
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="dob"
                        className="input-field"
                        value={formData.dob}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contact_number"
                        className="input-field"
                        value={formData.contact_number}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      className="input-field"
                      rows="3"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h2 className="text-xl font-semibold text-primary-800 mb-4">Emergency Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      Emergency Contact Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_person"
                      className="input-field"
                      value={formData.emergency_contact_person}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">
                      Emergency Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_number"
                      className="input-field"
                      value={formData.emergency_contact_number}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 justify-center pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-8"
                >
                  {loading ? 'Saving...' : 'Save Student Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary px-8"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        isOpen={showSaveConfirm}
        title="Confirm Student Save"
        message="Save this student information now?"
        confirmLabel="Yes, Save"
        isLoading={loading}
        onConfirm={confirmSaveStudent}
        onClose={() => setShowSaveConfirm(false)}
      />
    </div>
  )
}
