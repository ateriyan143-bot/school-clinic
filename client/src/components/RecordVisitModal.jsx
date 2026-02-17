import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ConfirmActionModal from './ConfirmActionModal'
import { X } from 'lucide-react'

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

export default function RecordVisitModal({ student, onClose, onSuccess }) {
  const { user, getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [targetStudentId, setTargetStudentId] = useState('')
  const [students, setStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState(student?.id || '')
  const [isOtherComplaint, setIsOtherComplaint] = useState(false)
  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    time_in: new Date().toTimeString().split(' ')[0].substring(0, 5),
    chief_complaint: '',
    blood_pressure: '',
    temperature: '',
    assessment: '',
    intervention: '',
    medication_given: '',
    disposition: '',
    nurse_name: user?.display_name || ''
  })

  useEffect(() => {
    // If no student is provided, fetch all students for selection
    if (!student) {
      fetchStudents()
    }
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const studentIdToUse = student?.id || selectedStudentId
    
    if (!studentIdToUse) {
      alert('Please select a student')
      return
    }

    setTargetStudentId(studentIdToUse)
    setShowSaveConfirm(true)
  }

  const confirmSaveVisit = async () => {
    setShowSaveConfirm(false)
    setLoading(true)

    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          ...formData,
          student_id: targetStudentId
        })
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(`Error recording visit: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error recording visit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-primary-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Record Clinic Visit</h2>
            {student && (
              <p className="text-sm text-gray-600 mt-1">
                Add a new visit record for {student.full_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Selection (if not pre-selected) */}
          {!student && (
            <div>
              <label className="label">
                Select Student <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
              >
                <option value="">-- Select a student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} (Grade {s.grade_level})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Visit Date & Time */}
          <div>
            <h3 className="text-lg font-semibold text-primary-800 mb-4">Visit Date & Time</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Date of Admission <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="visit_date"
                  className="input-field"
                  value={formData.visit_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="label">
                  Time In <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="time_in"
                  className="input-field"
                  value={formData.time_in}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="label">
              Chief Complaint <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={isOtherComplaint ? 'Others' : formData.chief_complaint}
              onChange={(e) => {
                if (e.target.value === 'Others') {
                  setIsOtherComplaint(true)
                  setFormData({ ...formData, chief_complaint: '' })
                } else {
                  setIsOtherComplaint(false)
                  setFormData({ ...formData, chief_complaint: e.target.value })
                }
              }}
              required={!isOtherComplaint}
            >
              <option value="">Select complaint</option>
              {complaintOptions.map((complaint) => (
                <option key={complaint} value={complaint}>
                  {complaint}
                </option>
              ))}
              <option value="Others">Others</option>
            </select>
            {isOtherComplaint && (
              <input
                type="text"
                className="input-field mt-2"
                placeholder="Please specify the illness"
                value={formData.chief_complaint}
                onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                required
              />
            )}
          </div>

          {/* Vital Signs */}
          <div>
            <h3 className="text-lg font-semibold text-primary-800 mb-4">Vital Signs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  BP <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="blood_pressure"
                    className="input-field"
                    placeholder="120/80"
                    value={formData.blood_pressure}
                    onChange={handleChange}
                    required
                  />
                  <span className="text-gray-600">mmHg</span>
                </div>
              </div>
              <div>
                <label className="label">
                  Temp <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    className="input-field"
                    value={formData.temperature}
                    onChange={handleChange}
                    required
                  />
                  <span className="text-gray-600">°C</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment & Intervention */}
          <div>
            <h3 className="text-lg font-semibold text-primary-800 mb-4">Assessment & Intervention</h3>
            <div className="space-y-4">
              <div>
                <label className="label">
                  Assessment <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="assessment"
                  className="input-field"
                  rows="3"
                  value={formData.assessment}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="label">
                  Intervention Given <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="intervention"
                  className="input-field"
                  rows="3"
                  value={formData.intervention}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="label">Medication Administered (optional)</label>
                <input
                  type="text"
                  name="medication_given"
                  className="input-field"
                  value={formData.medication_given}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Disposition & Nurse */}
          <div>
            <h3 className="text-lg font-semibold text-primary-800 mb-4">Disposition & Nurse Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Disposition <span className="text-red-500">*</span>
                </label>
                <select
                  name="disposition"
                  className="input-field"
                  value={formData.disposition}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Disposition</option>
                  <option value="Returned to Class">Returned to Class</option>
                  <option value="Sent Home">Sent Home</option>
                  <option value="Referred to Hospital">Referred to Hospital</option>
                  <option value="Under Observation">Under Observation</option>
                </select>
              </div>
              <div>
                <label className="label">Nurse Name</label>
                <input
                  type="text"
                  name="nurse_name"
                  className="input-field"
                  value={formData.nurse_name}
                  onChange={handleChange}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center pt-4 border-t border-primary-100">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-8"
            >
              {loading ? 'Saving...' : 'Save Visit Record'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-8"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <ConfirmActionModal
        isOpen={showSaveConfirm}
        title="Confirm Medical Record Save"
        message="Save this clinic visit record now?"
        confirmLabel="Yes, Save"
        isLoading={loading}
        onConfirm={confirmSaveVisit}
        onClose={() => setShowSaveConfirm(false)}
      />
    </div>
  )
}
