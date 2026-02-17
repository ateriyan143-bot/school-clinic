import { Eye, Edit, Trash2 } from 'lucide-react'

export default function StudentTable({ students, loading, onViewProfile, onEditStudent, onDeleteStudent }) {
  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-12 text-gray-500">Loading students...</div>
      </div>
    )
  }

  return (
    <div className="card p-0">
      <div className="overflow-x-auto rounded-lg border border-primary-100">
        <table className="w-full min-w-[640px]">
          <thead className="bg-primary-600">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Full Name</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Grade</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Section</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide hidden sm:table-cell">Last Visit</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-3 sm:px-6 py-12 text-center text-gray-500 text-sm">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-primary-50/40 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {student.profile_image_url ? (
                        <img
                          src={student.profile_image_url}
                          alt={student.full_name}
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border border-primary-100"
                        />
                      ) : (
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                          {student.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="truncate">{student.full_name}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{student.grade_level}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">{student.section}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                    {student.last_visit ? new Date(student.last_visit).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    <div className="flex gap-1 sm:gap-2 flex-wrap">
                      <button
                        onClick={() => onViewProfile(student)}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-all duration-150 hover:-translate-y-0.5 text-xs sm:text-sm"
                        title="View Profile"
                      >
                        <Eye size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={() => onEditStudent(student)}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-accent-100 text-accent-900 rounded border border-accent-200 hover:bg-accent-200 transition-all duration-150 text-xs sm:text-sm"
                        title="Edit Student"
                      >
                        <Edit size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => onDeleteStudent(student)}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs sm:text-sm"
                        title="Delete Student"
                      >
                        <Trash2 size={14} className="sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
