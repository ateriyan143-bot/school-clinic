import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const toDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getStudentDateKey = (createdAt) => {
  if (!createdAt) return null
  const value = String(createdAt)
  if (value.length >= 10 && value[4] === '-' && value[7] === '-') {
    return value.slice(0, 10)
  }

  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) return null
  return toDateKey(parsed)
}

const getAdmissionTimeLabel = (createdAt) => {
  if (!createdAt) return 'Time unavailable'

  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) return 'Time unavailable'

  return parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getDotStyle = (count) => {
  if (count >= 6) return { dots: 3, colorClass: 'bg-accent-500' }
  if (count >= 3) return { dots: 2, colorClass: 'bg-primary-500' }
  if (count >= 1) return { dots: 1, colorClass: 'bg-primary-300' }
  return { dots: 0, colorClass: '' }
}

export default function MiniAdmissionCalendar({ students = [], compact = false, className = '' }) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today))

  const admissionCounts = useMemo(() => {
    const counts = {}
    students.forEach((student) => {
      const key = getStudentDateKey(student.created_at)
      if (!key) return
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }, [students])

  const admissionsByDate = useMemo(() => {
    const admissionsMap = {}
    students.forEach((student) => {
      const key = getStudentDateKey(student.created_at)
      if (!key || !student.full_name) return
      if (!admissionsMap[key]) {
        admissionsMap[key] = []
      }
      admissionsMap[key].push({
        full_name: student.full_name,
        timeLabel: getAdmissionTimeLabel(student.created_at)
      })
    })
    return admissionsMap
  }, [students])

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const calendarCells = []
  for (let index = 0; index < firstDay; index += 1) {
    calendarCells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    calendarCells.push(dayDate)
  }

  const selectedCount = admissionCounts[selectedDateKey] || 0
  const selectedDate = new Date(`${selectedDateKey}T00:00:00`)
  const selectedLabel = Number.isNaN(selectedDate.getTime())
    ? selectedDateKey
    : selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className={`card mb-6 ${className}`}>
      <div className={`${compact ? 'mb-3' : 'mb-4 flex items-center justify-between'}`}>
        <h2 className={`text-lg font-semibold text-gray-900 ${compact ? 'mb-2 leading-tight' : ''}`}>Admissions Calendar</h2>
        <div className={`flex items-center gap-2 ${compact ? 'w-full' : ''}`}>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="w-8 h-8 shrink-0 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <p className={`text-sm font-semibold text-primary-800 text-center ${compact ? 'flex-1 truncate' : 'min-w-[140px]'}`}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="w-8 h-8 shrink-0 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-7 ${compact ? 'gap-1 mb-1' : 'gap-2 mb-2'}`}>
        {WEEK_DAYS.map((label, index) => (
          <div key={`${label}-${index}`} className="text-center text-xs font-semibold text-primary-700">
            {label}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${compact ? 'gap-1' : 'gap-2'}`}>
        {calendarCells.map((dayDate, index) => {
          if (!dayDate) {
            return <div key={`empty-${index}`} className={`${compact ? 'h-12' : 'h-14'} rounded-lg bg-transparent`} />
          }

          const dateKey = toDateKey(dayDate)
          const count = admissionCounts[dateKey] || 0
          const admittedEntries = admissionsByDate[dateKey] || []
          const isSelected = dateKey === selectedDateKey
          const isToday = dateKey === toDateKey(today)
          const dotStyle = getDotStyle(count)

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => setSelectedDateKey(dateKey)}
              className={`group relative ${compact ? 'h-12' : 'h-14'} rounded-lg border px-1 py-1 flex flex-col items-center justify-between transition-colors ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-primary-100 bg-white hover:bg-primary-50'
              }`}
            >
              <span className={`text-xs font-semibold ${isToday ? 'text-accent-700' : 'text-gray-700'}`}>
                {dayDate.getDate()}
              </span>
              <div className="h-2 flex items-center justify-center gap-1">
                {Array.from({ length: dotStyle.dots }).map((_, dotIndex) => (
                  <span
                    key={`${dateKey}-dot-${dotIndex}`}
                    className={`w-1.5 h-1.5 rounded-full ${dotStyle.colorClass}`}
                  />
                ))}
              </div>

              {admittedEntries.length > 0 && (
                <div className="hidden group-hover:block pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-20 w-64 rounded-lg border border-primary-200 bg-white shadow-lg p-3 text-left">
                  <p className="text-xs font-semibold text-primary-800 mb-2">
                    Admitted students ({admittedEntries.length})
                  </p>
                  <div className="space-y-1.5">
                    {admittedEntries.slice(0, 6).map((entry, entryIndex) => (
                      <div key={`${dateKey}-entry-${entryIndex}`} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-gray-800 truncate">{entry.full_name}</span>
                        <span className="text-primary-700 font-medium shrink-0">{entry.timeLabel}</span>
                      </div>
                    ))}
                  </div>
                  {admittedEntries.length > 6 && (
                    <p className="mt-2 text-xs text-gray-500">+ {admittedEntries.length - 6} more</p>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 ${compact ? 'mt-3' : 'mt-4'}`}>
        <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700`}>
          <span className="font-semibold text-primary-800">{selectedLabel}:</span> {selectedCount} admitted student{selectedCount === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary-300" />
            <span>1-2</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            <span>3-5</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent-500" />
            <span>6+</span>
          </div>
        </div>
      </div>
    </div>
  )
}
