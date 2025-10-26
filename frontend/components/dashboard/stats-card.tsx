import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
  textLabelColor: string
  textNumberColor: string
  borderColor: string
}

export function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor,
  iconBgColor,
  textLabelColor,
  textNumberColor,
  borderColor,
}: StatsCardProps) {
  const changeColor = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400',
  }[changeType]

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border ${borderColor} dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${textLabelColor} mb-1`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${textNumberColor}`}>
            {value}
          </p>
          {change && (
            <p className={`text-sm font-medium mt-2 ${changeColor}`}>
              {change}
            </p>
          )}
        </div>
        <div
          className={`w-14 h-14 rounded-full ${iconBgColor} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-7 h-7 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}
