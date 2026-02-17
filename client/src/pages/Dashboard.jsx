import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import Sidebar from '../components/Sidebar'
import StatsCard from '../components/StatsCard'
import StudentTable from '../components/StudentTable'
import RecordVisitModal from '../components/RecordVisitModal'
import DeleteStudentModal from '../components/DeleteStudentModal'
import MiniAdmissionCalendar from '../components/MiniAdmissionCalendar'
import { Users, Calendar, TrendingUp, Activity } from 'lucide-react'

const STUDENTS_PER_PAGE = 10

const SECTION_GROUPS = {
  'GRADE 7': ['AGLIPAY', 'BURGOS', 'GOMEZ', 'DELA CRUZ', 'RUIZ', 'ZAMORA', 'CALUNGSOD'],
  'GRADE 8': ['AGUINALDO', 'LAUREL', 'MAGSAYSAY', 'ROXAS', 'OSMEÑA', 'QUEZON', 'QUIRINO'],
  'GRADE 9': ['JAENA', 'HIDALGO', 'LUNA', 'DEL PILAR', 'RIZAL', 'REGIDOR', 'PONCE'],
  'GRADE 10': ['ALVAREZ', 'ARELLANO', 'BONIFACIO', 'MABINI', 'MALVAR', 'JACINTO', 'RINT'],
  'GRADE 11': ['HUMSS-AGONCILLO', '11-ALS', 'HUMSS-SILANG', 'HUMSS-DE JESUS', 'TVL-HE-ESCODA', 'TVL-ICT-DIZON', 'STEM-DEL MUNDO', 'ABM-MAGBANUA'],
  'GRADE 12': ['ABM-RIVERA', 'STEM-AQUINO', 'HUMSS-FERNANDEZ', 'HUMSS-HENSON', 'HUMSS-LEONES', '12-ALS', 'TVL-ICT-BARROS', 'TVL-ICT-VILLAVICENCIO']
}

const getSectionsByGrade = (gradeLevel) => SECTION_GROUPS[`GRADE ${gradeLevel}`] || []

function PdfDownloadIcon() {
  return (
    <svg width="58" height="58" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M12 8h26l14 14v30a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6z" fill="white" stroke="#1f2937" strokeWidth="2.5" />
      <path d="M38 8v14h14" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="12" y="43" width="40" height="15" rx="5" fill="#DC2626" />
      <text x="32" y="53.5" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif">PDF</text>
      <path d="M23 21c0-2.8 2.2-5 5-5s5 2.2 5 5c0 4-2.5 6.5-5 10-2.3-3.2-5-6-5-10z" fill="#DC2626" />
      <path d="M28 18v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M44 24v10" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
      <path d="M39 31l5 6 5-6" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XlsDownloadIcon() {
  return (
    <svg width="58" height="58" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M12 8h26l14 14v30a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6z" fill="white" stroke="#1f2937" strokeWidth="2.5" />
      <path d="M38 8v14h14" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="12" y="43" width="40" height="15" rx="5" fill="#16A34A" />
      <text x="32" y="53.5" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Arial, sans-serif">XLS</text>
      <rect x="22" y="18" width="18" height="14" rx="1.5" fill="#16A34A" opacity="0.18" />
      <path d="M22 22h18M22 26h18M27 18v14M33 18v14" stroke="#16A34A" strokeWidth="1.6" />
      <path d="M44 24v10" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
      <path d="M39 31l5 6 5-6" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, getToken } = useAuth()
  const [students, setStudents] = useState([])
  const [visitsForExport, setVisitsForExport] = useState([])
  const [illnessFrequency, setIllnessFrequency] = useState([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    visitsToday: 0,
    visitsThisMonth: 0,
    commonIllness: 'Loading...'
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ grade: '', section: '', search: '' })
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState(null)
  const [deletingStudent, setDeletingStudent] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters.grade, filters.section, filters.search])

  const fetchDashboardData = async () => {
    try {
      const token = getToken()
      const [studentsRes, statsRes, illnessRes, visitsRes] = await Promise.all([
        fetch('/api/students', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/analytics/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/analytics/illness-frequency', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/visits', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (studentsRes.ok && statsRes.ok) {
        const studentsData = await studentsRes.json()
        const statsData = await statsRes.json()
        setStudents(studentsData)
        setStats(statsData)

        if (illnessRes.ok) {
          const illnessData = await illnessRes.json()
          setIllnessFrequency(Array.isArray(illnessData) ? illnessData : [])
        } else {
          setIllnessFrequency([])
        }

        if (visitsRes.ok) {
          const visitsData = await visitsRes.json()
          setVisitsForExport(Array.isArray(visitsData) ? visitsData : [])
        } else {
          setVisitsForExport([])
        }
      } else {
        console.error('API error:', studentsRes.status, statsRes.status)
        setStudents([])
        setIllnessFrequency([])
        setVisitsForExport([])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setStudents([])
      setIllnessFrequency([])
      setVisitsForExport([])
    } finally {
      setLoading(false)
    }
  }

  const handleRecordVisit = (student) => {
    setSelectedStudent(student)
    setShowVisitModal(true)
  }

  const handleDeleteStudent = async (student) => {
    setStudentToDelete(student)
    setShowDeleteModal(true)
  }

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return

    setDeletingStudent(true)
    try {
      const response = await fetch(`/api/students/${studentToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })

      if (!response.ok) {
        throw new Error('Failed to delete student')
      }

      setShowDeleteModal(false)
      setStudentToDelete(null)
      fetchDashboardData()
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Failed to delete student')
    } finally {
      setDeletingStudent(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesGrade = !filters.grade || student.grade_level.toString() === filters.grade
    const matchesSection = !filters.section || student.section === filters.section
    const matchesSearch = !filters.search || 
      student.full_name.toLowerCase().includes(filters.search.toLowerCase())
    
    return matchesGrade && matchesSection && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE))
  const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + STUDENTS_PER_PAGE)

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const availableSections = getSectionsByGrade(filters.grade)
  const normalizedIllnesses = illnessFrequency.map((item) => ({
    label: item.chief_complaint || 'Unspecified',
    count: Number(item.count) || 0
  }))

  const displayIllnesses = normalizedIllnesses.length > 5
    ? [
        ...normalizedIllnesses.slice(0, 4),
        {
          label: 'Other illnesses',
          count: normalizedIllnesses.slice(4).reduce((sum, item) => sum + item.count, 0)
        }
      ]
    : normalizedIllnesses.slice(0, 5)

  const totalIllnessCount = displayIllnesses.reduce((sum, item) => sum + item.count, 0)
  const piePalette = [
    { strokeClass: 'text-primary-500', dotClass: 'bg-primary-500' },
    { strokeClass: 'text-accent-500', dotClass: 'bg-accent-500' },
    { strokeClass: 'text-sky-500', dotClass: 'bg-sky-500' },
    { strokeClass: 'text-orange-500', dotClass: 'bg-orange-500' },
    { strokeClass: 'text-violet-500', dotClass: 'bg-violet-500' },
    { strokeClass: 'text-emerald-500', dotClass: 'bg-emerald-500' }
  ]
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let cumulativeRatio = 0
  const pieSlices = displayIllnesses.map((item, index) => {
    const ratio = totalIllnessCount > 0 ? item.count / totalIllnessCount : 0
    const dash = ratio * circumference
    const offset = -cumulativeRatio * circumference
    cumulativeRatio += ratio
    const palette = piePalette[index % piePalette.length]

    return {
      ...item,
      ratio,
      dash,
      offset,
      strokeClass: palette.strokeClass,
      dotClass: palette.dotClass
    }
  })

  const exportRows = visitsForExport.map((visit) => ({
    full_name: visit.full_name || '',
    grade_level: visit.grade_level || '',
    section: visit.section || '',
    sex: visit.sex || '',
    chief_complaint: visit.chief_complaint || '',
    temperature: visit.temperature ?? '',
    assessment: visit.assessment || '',
    intervention: visit.intervention || '',
    medication_given: visit.medication_given || '',
    disposition: visit.disposition || ''
  }))

  const handleExportExcel = () => {
    if (exportRows.length === 0) {
      alert('No visit data available to export.')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clinic Visits')
    XLSX.writeFile(workbook, `clinic-visits-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handleExportPdf = () => {
    if (exportRows.length === 0) {
      alert('No visit data available to export.')
      return
    }

    const document = new jsPDF({ orientation: 'landscape' })
    const headers = [[
      'Full Name',
      'Grade',
      'Section',
      'Sex',
      'Chief Complaint',
      'Temperature',
      'Assessment',
      'Intervention',
      'Medication Given',
      'Disposition'
    ]]

    const body = exportRows.map((row) => ([
      row.full_name,
      row.grade_level,
      row.section,
      row.sex,
      row.chief_complaint,
      row.temperature,
      row.assessment,
      row.intervention,
      row.medication_given,
      row.disposition
    ]))

    document.setFontSize(12)
    document.text('School Clinic Visit Export', 14, 14)

    autoTable(document, {
      head: headers,
      body,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [21, 128, 61] }
    })

    document.save(`clinic-visits-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto pl-0 lg:pl-0">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-primary-700 mt-2 text-sm sm:text-base">Monitor student health activity with quick actions and live trends.</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatsCard
                title="Total Registered Students"
                value={stats.totalStudents}
                icon={<Users className="w-8 h-8 text-primary-600" />}
                color="green"
              />
              <StatsCard
                title="Total Visits Today"
                value={stats.visitsToday}
                icon={<Calendar className="w-8 h-8 text-accent-600" />}
                color="red"
              />
              <StatsCard
                title="Total Visits This Month"
                value={stats.visitsThisMonth}
                icon={<TrendingUp className="w-8 h-8 text-primary-600" />}
                color="blue"
              />
              <StatsCard
                title="Most Common Illness"
                value={stats.commonIllness}
                icon={<Activity className="w-8 h-8 text-accent-700" />}
                color="purple"
              />
            </div>

            <MiniAdmissionCalendar students={students} compact className="mb-0" />

            <div className="xl:col-span-2 card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Illness Overview</p>
                  <h2 className="text-lg font-semibold text-gray-900">Most Frequent Cases</h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-200">
                  Top reported this period
                </span>
              </div>

              <div className="mt-4">
                {displayIllnesses.length === 0 ? (
                  <p className="text-sm text-gray-500">No illness frequency data available yet.</p>
                ) : (
                  <div className="rounded-lg border border-primary-100 bg-white p-4">
                    <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                      <div className="relative w-36 h-36 shrink-0">
                        <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="14" className="stroke-primary-100" />
                          {pieSlices.map((slice, index) => (
                            <circle
                              key={`slice-${slice.label}-${index}`}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="14"
                              strokeDasharray={`${slice.dash} ${circumference - slice.dash}`}
                              strokeDashoffset={slice.offset}
                              className={slice.strokeClass}
                              strokeLinecap="butt"
                            />
                          ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-[11px] text-gray-500">Total</p>
                          <p className="text-xl font-bold text-gray-900">{totalIllnessCount}</p>
                        </div>
                      </div>

                      <div className="flex-1 w-full space-y-2.5">
                        {pieSlices.map((slice, index) => (
                          <div key={`legend-${slice.label}-${index}`} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${slice.dotClass}`} />
                              <p className="text-sm text-gray-800 truncate">{slice.label}</p>
                            </div>
                            <p className="text-xs font-semibold text-primary-700 shrink-0">
                              {Math.round(slice.ratio * 100)}% ({slice.count})
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Export Reports</p>
                  <h4 className="text-md font-semibold text-gray-900">Download Student Visit Records</h4>
                </div>
                <span className="text-xs text-gray-500">{exportRows.length} rows</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="btn-primary"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="btn-accent"
                >
                  Export Excel
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-primary-100">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 py-4 text-primary-700 hover:bg-primary-100 transition-colors"
                    aria-label="Export PDF with icon"
                  >
                    <PdfDownloadIcon />
                    <span className="text-xs font-semibold">PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border border-accent-200 bg-accent-50 py-4 text-accent-800 hover:bg-accent-100 transition-colors"
                    aria-label="Export Excel with icon"
                  >
                    <XlsDownloadIcon />
                    <span className="text-xs font-semibold">Excel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="card mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center flex-1">
                <input
                  type="text"
                  placeholder="Search by student name"
                  className="input-field max-w-md"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
                <select
                  className="input-field w-auto"
                  value={filters.grade}
                  onChange={(e) => setFilters({ ...filters, grade: e.target.value, section: '' })}
                >
                  <option value="">Grade</option>
                  {[7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
                <select
                  className="input-field w-auto"
                  value={filters.section}
                  disabled={!filters.grade}
                  onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                >
                  <option value="">{filters.grade ? 'Section' : 'Select Grade First'}</option>
                  {availableSections.map((section) => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/students/new')}
                  className="btn-primary flex items-center gap-2"
                >
                  + Add Student
                </button>
                <button
                  onClick={() => setShowVisitModal(true)}
                  className="btn-accent flex items-center gap-2"
                >
                  + Record Clinic Visit
                </button>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <StudentTable
            students={paginatedStudents}
            loading={loading}
            onViewProfile={(student) => navigate(`/students/${student.id}`)}
            onEditStudent={(student) => navigate(`/students/${student.id}?edit=1`)}
            onDeleteStudent={handleDeleteStudent}
          />

          {!loading && filteredStudents.length > STUDENTS_PER_PAGE && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(startIndex + STUDENTS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} students
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={
                      page === currentPage
                        ? 'px-3 py-2 rounded bg-primary-600 text-white text-sm font-medium'
                        : 'px-3 py-2 rounded border border-primary-200 text-primary-700 bg-white text-sm hover:bg-primary-50'
                    }
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showVisitModal && (
        <RecordVisitModal
          student={selectedStudent}
          onClose={() => {
            setShowVisitModal(false)
            setSelectedStudent(null)
          }}
          onSuccess={() => {
            fetchDashboardData()
            setShowVisitModal(false)
            setSelectedStudent(null)
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteStudentModal
          student={studentToDelete}
          isDeleting={deletingStudent}
          onClose={() => {
            if (deletingStudent) return
            setShowDeleteModal(false)
            setStudentToDelete(null)
          }}
          onConfirm={confirmDeleteStudent}
        />
      )}
    </div>
  )
}
