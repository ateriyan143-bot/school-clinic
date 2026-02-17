import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/Sidebar'
import RecordVisitModal from '../components/RecordVisitModal'
import ConfirmActionModal from '../components/ConfirmActionModal'
import { ArrowLeft, Edit, Plus, X, Save } from 'lucide-react'

const complaintOptions = [
  'Headache',
  'Fever',
  'Toothache',
  'Stomachache',
  'Dizziness',
  'Vomiting',
  'Difficulty on Breathing',
  'Colds',
  'Cough',
  'Dysmenorrhea',
  'Sore Throat',
  'Sprain',
  'Loose Bowel Movement',
  'Chest Pain',
  'Nosebleed',
  'Body Malaise',
  'Chills'
]

const SECTION_GROUPS = {
  'GRADE 7': ['AGLIPAY', 'BURGOS', 'GOMEZ', 'DELA CRUZ', 'RUIZ', 'ZAMORA', 'CALUNGSOD'],
  'GRADE 8': ['AGUINALDO', 'LAUREL', 'MAGSAYSAY', 'ROXAS', 'OSMEÑA', 'QUEZON', 'QUIRINO'],
  'GRADE 9': ['JAENA', 'HIDALGO', 'LUNA', 'DEL PILAR', 'RIZAL', 'REGIDOR', 'PONCE'],
  'GRADE 10': ['ALVAREZ', 'ARELLANO', 'BONIFACIO', 'MABINI', 'MALVAR', 'JACINTO', 'RINT'],
  'GRADE 11': ['HUMSS-AGONCILLO', '11-ALS', 'HUMSS-SILANG', 'HUMSS-DE JESUS', 'TVL-HE-ESCODA', 'TVL-ICT-DIZON', 'STEM-DEL MUNDO', 'ABM-MAGBANUA'],
  'GRADE 12': ['ABM-RIVERA', 'STEM-AQUINO', 'HUMSS-FERNANDEZ', 'HUMSS-HENSON', 'HUMSS-LEONES', '12-ALS', 'TVL-ICT-BARROS', 'TVL-ICT-VILLAVICENCIO']
}

const getSectionsByGrade = (gradeLevel) => SECTION_GROUPS[`GRADE ${gradeLevel}`] || []
const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024

export default function StudentProfile() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { getToken } = useAuth()
  const [student, setStudent] = useState(null)
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [showStudentSaveConfirm, setShowStudentSaveConfirm] = useState(false)
  const [showVisitSaveConfirm, setShowVisitSaveConfirm] = useState(false)
  const [pendingVisitSaveId, setPendingVisitSaveId] = useState(null)
  const [studentSaveError, setStudentSaveError] = useState('')
  const [isEditingStudent, setIsEditingStudent] = useState(false)
  const [savingStudent, setSavingStudent] = useState(false)
  const [editingVisitId, setEditingVisitId] = useState(null)
  const [savingVisit, setSavingVisit] = useState(false)
  const [isOtherVisitComplaint, setIsOtherVisitComplaint] = useState(false)
  const [visitEditForm, setVisitEditForm] = useState({
    visit_date: '',
    time_in: '',
    chief_complaint: '',
    blood_pressure: '',
    temperature: '',
    assessment: '',
    intervention: '',
    medication_given: '',
    disposition: '',
    nurse_name: ''
  })
  const [editForm, setEditForm] = useState({
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

  const availableSections = getSectionsByGrade(editForm.grade_level)

  useEffect(() => {
    fetchStudentData()
  }, [studentId])

  useEffect(() => {
    setIsEditingStudent(searchParams.get('edit') === '1')
  }, [searchParams])

  const fetchStudentData = async () => {
    try {
      const token = getToken()
      const [studentRes, visitsRes] = await Promise.all([
        fetch(`/api/students/${studentId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/students/${studentId}/visits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const studentData = await studentRes.json()
      const visitsData = await visitsRes.json()

      setStudent(studentData)
      setVisits(visitsData)
      setEditForm({
        full_name: studentData.full_name || '',
        grade_level: studentData.grade_level || '',
        section: studentData.section || '',
        sex: studentData.sex || '',
        dob: studentData.dob ? studentData.dob.split('T')[0] : '',
        contact_number: studentData.contact_number || '',
        address: studentData.address || '',
        emergency_contact_person: studentData.emergency_contact_person || '',
        emergency_contact_number: studentData.emergency_contact_number || '',
        profile_image_url: studentData.profile_image_url || ''
      })
    } catch (error) {
      console.error('Error fetching student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditChange = (e) => {
    if (studentSaveError) {
      setStudentSaveError('')
    }

    if (e.target.name === 'grade_level') {
      setEditForm({
        ...editForm,
        grade_level: e.target.value,
        section: ''
      })
      return
    }

    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    })
  }

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setStudentSaveError('Please select a valid image file.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setStudentSaveError('Student photo is too large. Please upload an image up to 2MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setEditForm((prev) => ({
        ...prev,
        profile_image_url: typeof reader.result === 'string' ? reader.result : ''
      }))
    }
    reader.onerror = () => {
      setStudentSaveError('Failed to read image file. Please try another file.')
    }
    reader.readAsDataURL(file)
  }

  const handleSaveStudent = async () => {
    setSavingStudent(true)
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          ...editForm,
          grade_level: parseInt(editForm.grade_level)
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update student profile')
      }

      const updatedStudent = await response.json()
      setStudent(updatedStudent)
      setIsEditingStudent(false)
      setStudentSaveError('')
    } catch (error) {
      console.error('Error updating student profile:', error)
      setStudentSaveError(error.message || 'Failed to update student profile')
    } finally {
      setSavingStudent(false)
    }
  }

  const handleStartEditVisit = (visit) => {
    const bloodPressure = visit.blood_pressure ||
      (visit.systolic && visit.diastolic ? `${visit.systolic}/${visit.diastolic}` : '')

    setEditingVisitId(visit.id)
    const complaint = visit.chief_complaint || ''
    setIsOtherVisitComplaint(!complaintOptions.includes(complaint) && complaint !== '')
    setVisitEditForm({
      visit_date: visit.visit_date ? visit.visit_date.split('T')[0] : '',
      time_in: visit.time_in ? visit.time_in.slice(0, 5) : '',
      chief_complaint: visit.chief_complaint || '',
      blood_pressure: bloodPressure,
      temperature: visit.temperature || '',
      assessment: visit.assessment || '',
      intervention: visit.intervention || '',
      medication_given: visit.medication_given || '',
      disposition: visit.disposition || '',
      nurse_name: visit.nurse_name || ''
    })
  }

  const handleVisitEditChange = (e) => {
    setVisitEditForm({
      ...visitEditForm,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveVisit = async (visitId) => {
    setSavingVisit(true)
    try {
      const response = await fetch(`/api/visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(visitEditForm)
      })

      if (!response.ok) {
        throw new Error('Failed to update visit')
      }

      const updatedVisit = await response.json()
      setVisits(visits.map((visit) => (visit.id === visitId ? updatedVisit : visit)))
      setEditingVisitId(null)
    } catch (error) {
      console.error('Error updating visit:', error)
      alert('Failed to update medical record')
    } finally {
      setSavingVisit(false)
    }
  }

  const requestSaveStudent = () => {
    setShowStudentSaveConfirm(true)
  }

  const requestSaveVisit = (visitId) => {
    setPendingVisitSaveId(visitId)
    setShowVisitSaveConfirm(true)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!student) {
    return <div className="flex items-center justify-center h-screen">Student not found</div>
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

          {/* Student Header */}
          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                  {((isEditingStudent ? editForm.profile_image_url : student.profile_image_url)) ? (
                    <img
                      src={isEditingStudent ? editForm.profile_image_url : student.profile_image_url}
                      alt={student.full_name}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl">👤</span>
                  )}
                </div>
                <div>
                  {isEditingStudent ? (
                    <div className="space-y-3 mb-4">
                      <input
                        type="text"
                        name="full_name"
                        className="input-field text-2xl font-bold"
                        value={editForm.full_name}
                        onChange={handleEditChange}
                      />
                      <div>
                        <label className="label">Student Photo (Optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="input-field"
                          onChange={handlePhotoUpload}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {student.full_name}
                      </h1>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {isEditingStudent ? (
                      <>
                        <div>
                          <span className="font-medium">Grade:</span>
                          <select
                            name="grade_level"
                            className="input-field mt-1"
                            value={editForm.grade_level}
                            onChange={handleEditChange}
                          >
                            {[7, 8, 9, 10, 11, 12].map((g) => (
                              <option key={g} value={g}>Grade {g}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <span className="font-medium">Contact Number:</span>
                          <input
                            type="text"
                            name="contact_number"
                            className="input-field mt-1"
                            value={editForm.contact_number}
                            onChange={handleEditChange}
                          />
                        </div>
                        <div>
                          <span className="font-medium">Section:</span>
                          <select
                            name="section"
                            className="input-field mt-1"
                            value={editForm.section}
                            onChange={handleEditChange}
                            disabled={!editForm.grade_level}
                          >
                            <option value="">{editForm.grade_level ? 'Select Section' : 'Select Grade Level First'}</option>
                            {availableSections.map((section) => (
                              <option key={section} value={section}>{section}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <span className="font-medium">Address:</span>
                          <input
                            type="text"
                            name="address"
                            className="input-field mt-1"
                            value={editForm.address}
                            onChange={handleEditChange}
                          />
                        </div>
                        <div>
                          <span className="font-medium">Date of Birth:</span>
                          <input
                            type="date"
                            name="dob"
                            className="input-field mt-1"
                            value={editForm.dob}
                            onChange={handleEditChange}
                          />
                        </div>
                        <div>
                          <span className="font-medium">Emergency Contact Name:</span>
                          <input
                            type="text"
                            name="emergency_contact_person"
                            className="input-field mt-1"
                            value={editForm.emergency_contact_person}
                            onChange={handleEditChange}
                          />
                        </div>
                        <div>
                          <span className="font-medium">Emergency Contact Number:</span>
                          <input
                            type="text"
                            name="emergency_contact_number"
                            className="input-field mt-1"
                            value={editForm.emergency_contact_number}
                            onChange={handleEditChange}
                          />
                        </div>
                        <div>
                          <span className="font-medium">Sex:</span>
                          <select
                            name="sex"
                            className="input-field mt-1"
                            value={editForm.sex}
                            onChange={handleEditChange}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="font-medium">Grade:</span> {student.grade_level}th Grade
                        </div>
                        <div>
                          <span className="font-medium">Contact Number:</span> {student.contact_number}
                        </div>
                        <div>
                          <span className="font-medium">Section:</span> {student.section}
                        </div>
                        <div>
                          <span className="font-medium">Address:</span> {student.address}
                        </div>
                        <div>
                          <span className="font-medium">Date of Birth:</span> {new Date(student.dob).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Emergency Contact:</span> {student.emergency_contact_person} ({student.emergency_contact_number})
                        </div>
                        <div>
                          <span className="font-medium">Sex:</span> {student.sex}
                        </div>
                      </>
                    )}
                  </div>
                </div>
            </div>

            {studentSaveError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {studentSaveError}
              </div>
            )}
          </div>

          {/* Clinic Visit History */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Clinic Visit History</h2>
              <div className="flex items-center gap-2">
                {isEditingStudent ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditingStudent(false)
                        setEditForm({
                          full_name: student.full_name || '',
                          grade_level: student.grade_level || '',
                          section: student.section || '',
                          sex: student.sex || '',
                          dob: student.dob ? student.dob.split('T')[0] : '',
                          contact_number: student.contact_number || '',
                          address: student.address || '',
                          emergency_contact_person: student.emergency_contact_person || '',
                          emergency_contact_number: student.emergency_contact_number || '',
                          profile_image_url: student.profile_image_url || ''
                        })
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={requestSaveStudent}
                      disabled={savingStudent}
                      className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:bg-gray-400"
                    >
                      {savingStudent ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingStudent(true)}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                  >
                    <Edit size={20} />
                    Edit Profile
                  </button>
                )}
                <button
                  onClick={() => setShowVisitModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add New Visit
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-primary-100">
              <table className="w-full">
                <thead className="bg-primary-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Chief Complaint</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Vital Signs</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Assessment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Intervention</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Disposition</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Nurse</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {visits.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                        No clinic visits recorded yet
                      </td>
                    </tr>
                  ) : (
                    visits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-primary-50/40 transition-colors">
                        <td className="px-4 py-3 text-sm">{new Date(visit.visit_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">{visit.time_in}</td>
                        <td className="px-4 py-3 text-sm">{visit.chief_complaint}</td>
                        <td className="px-4 py-3 text-sm">
                          BP: {visit.blood_pressure || (visit.systolic && visit.diastolic ? `${visit.systolic}/${visit.diastolic}` : 'N/A')}<br />
                          Temp: {visit.temperature || 'N/A'}°C
                        </td>
                        <td className="px-4 py-3 text-sm">{visit.assessment}</td>
                        <td className="px-4 py-3 text-sm">{visit.intervention}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-3 py-1 bg-primary-600 text-white text-xs rounded-full">
                            {visit.disposition}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{visit.nurse_name}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => handleStartEditVisit(visit)}
                            className="px-3 py-1.5 bg-accent-100 text-accent-900 border border-accent-200 rounded hover:bg-accent-200 transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Visit Modal */}
      {editingVisitId !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col border border-primary-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100 bg-primary-50 rounded-t-xl flex-shrink-0">
              <h3 className="text-lg font-bold text-primary-800">Edit Clinic Visit</h3>
              <button onClick={() => setEditingVisitId(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Visit Date</label>
                  <input type="date" name="visit_date" value={visitEditForm.visit_date} onChange={handleVisitEditChange} className="input-field" />
                </div>
                <div>
                  <label className="label">Time In</label>
                  <input type="time" name="time_in" value={visitEditForm.time_in} onChange={handleVisitEditChange} className="input-field" />
                </div>
              </div>

              <div>
                <label className="label">Chief Complaint</label>
                <select
                  name="chief_complaint"
                  value={isOtherVisitComplaint ? 'Others' : visitEditForm.chief_complaint}
                  onChange={(e) => {
                    if (e.target.value === 'Others') {
                      setIsOtherVisitComplaint(true)
                      setVisitEditForm({ ...visitEditForm, chief_complaint: '' })
                    } else {
                      setIsOtherVisitComplaint(false)
                      setVisitEditForm({ ...visitEditForm, chief_complaint: e.target.value })
                    }
                  }}
                  className="input-field"
                >
                  <option value="">Select Complaint</option>
                  {complaintOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  <option value="Others">Others</option>
                </select>
                {isOtherVisitComplaint && (
                  <input
                    type="text"
                    name="chief_complaint"
                    value={visitEditForm.chief_complaint}
                    onChange={handleVisitEditChange}
                    placeholder="Enter complaint"
                    className="input-field mt-2"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Blood Pressure</label>
                  <input type="text" name="blood_pressure" value={visitEditForm.blood_pressure} onChange={handleVisitEditChange} placeholder="e.g. 120/80" className="input-field" />
                </div>
                <div>
                  <label className="label">Temperature (°C)</label>
                  <input type="number" step="0.1" name="temperature" value={visitEditForm.temperature} onChange={handleVisitEditChange} className="input-field" />
                </div>
              </div>

              <div>
                <label className="label">Assessment</label>
                <textarea name="assessment" value={visitEditForm.assessment} onChange={handleVisitEditChange} rows="2" className="input-field" />
              </div>

              <div>
                <label className="label">Intervention</label>
                <textarea name="intervention" value={visitEditForm.intervention} onChange={handleVisitEditChange} rows="2" className="input-field" />
              </div>

              <div>
                <label className="label">Medication Given</label>
                <input type="text" name="medication_given" value={visitEditForm.medication_given} onChange={handleVisitEditChange} className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Disposition</label>
                  <select name="disposition" value={visitEditForm.disposition} onChange={handleVisitEditChange} className="input-field">
                    <option value="">Select</option>
                    <option value="Returned to Class">Returned to Class</option>
                    <option value="Sent Home">Sent Home</option>
                    <option value="Referred to Hospital">Referred to Hospital</option>
                    <option value="Under Observation">Under Observation</option>
                  </select>
                </div>
                <div>
                  <label className="label">Nurse Name</label>
                  <input type="text" name="nurse_name" value={visitEditForm.nurse_name} onChange={handleVisitEditChange} className="input-field" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-primary-100 bg-gray-50 rounded-b-xl flex-shrink-0">
              <button onClick={() => setEditingVisitId(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => requestSaveVisit(editingVisitId)}
                disabled={savingVisit}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                {savingVisit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showVisitModal && (
        <RecordVisitModal
          student={student}
          onClose={() => setShowVisitModal(false)}
          onSuccess={() => {
            fetchStudentData()
            setShowVisitModal(false)
          }}
        />
      )}

      <ConfirmActionModal
        isOpen={showStudentSaveConfirm}
        title="Confirm Student Info Update"
        message="Save changes to this student information?"
        confirmLabel="Yes, Save Changes"
        isLoading={savingStudent}
        onConfirm={async () => {
          setShowStudentSaveConfirm(false)
          await handleSaveStudent()
        }}
        onClose={() => setShowStudentSaveConfirm(false)}
      />

      <ConfirmActionModal
        isOpen={showVisitSaveConfirm}
        title="Confirm Medical Record Update"
        message="Save changes to this medical record?"
        confirmLabel="Yes, Save Changes"
        isLoading={savingVisit}
        onConfirm={async () => {
          setShowVisitSaveConfirm(false)
          if (pendingVisitSaveId) {
            await handleSaveVisit(pendingVisitSaveId)
            setPendingVisitSaveId(null)
          }
        }}
        onClose={() => {
          setShowVisitSaveConfirm(false)
          setPendingVisitSaveId(null)
        }}
      />
    </div>
  )
}
