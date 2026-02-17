export default function StatsCard({ title, value, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-primary-50 border-primary-200',
    green: 'bg-primary-100 border-primary-300',
    red: 'bg-accent-50 border-accent-200',
    purple: 'bg-accent-100 border-accent-300'
  }

  return (
    <div className={`card border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-primary-700 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="ml-4">
          {icon}
        </div>
      </div>
    </div>
  )
}
