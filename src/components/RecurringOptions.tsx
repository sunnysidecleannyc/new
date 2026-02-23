'use client'

interface RecurringOptionsProps {
  startDate: string
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  repeatType: string
  onRepeatTypeChange: (type: string) => void
  repeatEnd: string
  onRepeatEndChange: (end: string) => void
  repeatEndCount: number
  onRepeatEndCountChange: (count: number) => void
  repeatEndDate: string
  onRepeatEndDateChange: (date: string) => void
  customInterval: number
  onCustomIntervalChange: (interval: number) => void
  previewDates: string[]
}

export function RecurringOptions({
  startDate,
  enabled,
  onEnabledChange,
  repeatType,
  onRepeatTypeChange,
  repeatEnd,
  onRepeatEndChange,
  repeatEndCount,
  onRepeatEndCountChange,
  repeatEndDate,
  onRepeatEndDateChange,
  customInterval,
  onCustomIntervalChange,
  previewDates
}: RecurringOptionsProps) {
  
  // Get day info from start date
  const getDayInfo = () => {
    if (!startDate) return { dayName: 'Monday', weekOfMonth: '1st', dayOfMonth: 1 }
    const date = new Date(startDate + 'T12:00:00')
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = dayNames[date.getDay()]
    const dayOfMonth = date.getDate()
    const weekNum = Math.ceil(dayOfMonth / 7)
    const weekNames = ['1st', '2nd', '3rd', '4th', '5th']
    const weekOfMonth = weekNames[weekNum - 1] || '5th'
    return { dayName, weekOfMonth, dayOfMonth }
  }
  
  const { dayName, weekOfMonth, dayOfMonth } = getDayInfo()

  const repeatOptions = [
    { value: 'daily', label: 'Every day' },
    { value: 'weekly', label: `Every week on ${dayName}` },
    { value: 'biweekly', label: `Every 2 weeks on ${dayName}` },
    { value: 'triweekly', label: `Every 3 weeks on ${dayName}` },
    { value: 'monthly_date', label: `Every month on the ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}` },
    { value: 'monthly_day', label: `Every month on the ${weekOfMonth} ${dayName}` },
    { value: 'custom', label: 'Custom...' },
  ]

  function getOrdinalSuffix(n: number) {
    if (n > 3 && n < 21) return 'th'
    switch (n % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium text-[#1E2A4A]">Repeat</h4>
        <div 
          onClick={() => onEnabledChange(!enabled)}
          className={`w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-[#1E2A4A]' : 'bg-gray-300'} relative cursor-pointer`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </div>
      </div>

      {enabled && (
        <div className="space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          {/* Repeat Type */}
          <div>
            <label className="block text-sm font-medium text-[#1E2A4A] mb-2">Repeats</label>
            <select 
              value={repeatType} 
              onChange={(e) => onRepeatTypeChange(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[#1E2A4A] bg-white focus:ring-2 focus:ring-[#1E2A4A] outline-none"
            >
              {repeatOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Custom Interval */}
          {repeatType === 'custom' && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">Every</span>
              <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                <button
                  type="button"
                  onClick={() => onCustomIntervalChange(Math.max(1, customInterval - 1))}
                  className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-l-lg"
                >−</button>
                <span className="px-4 py-2 text-[#1E2A4A] font-medium min-w-[40px] text-center">{customInterval}</span>
                <button
                  type="button"
                  onClick={() => onCustomIntervalChange(customInterval + 1)}
                  className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-r-lg"
                >+</button>
              </div>
              <span className="text-sm text-gray-600">weeks</span>
            </div>
          )}

          {/* End Options */}
          <div>
            <label className="block text-sm font-medium text-[#1E2A4A] mb-2">End repeating</label>
            <select 
              value={repeatEnd} 
              onChange={(e) => onRepeatEndChange(e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[#1E2A4A] bg-white focus:ring-2 focus:ring-[#1E2A4A] outline-none"
            >
              <option value="never">Never</option>
              <option value="after">After X occurrences</option>
              <option value="on_date">On date</option>
            </select>
          </div>

          {repeatEnd === 'after' && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">After</span>
              <input 
                type="number" 
                min="1" 
                max="52"
                value={repeatEndCount} 
                onChange={(e) => onRepeatEndCountChange(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-[#1E2A4A] text-center"
              />
              <span className="text-sm text-gray-600">occurrences</span>
            </div>
          )}

          {repeatEnd === 'on_date' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">End date</label>
              <input 
                type="date" 
                value={repeatEndDate} 
                onChange={(e) => onRepeatEndDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[#1E2A4A]"
              />
            </div>
          )}

          {/* Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-2">
              Will create <span className="font-semibold text-[#1E2A4A]">{previewDates.length}</span> bookings:
            </p>
            <div className="max-h-24 overflow-y-auto text-xs text-gray-500 space-y-1">
              {previewDates.slice(0, 5).map((date, i) => (
                <div key={i}>
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { 
                    weekday: 'short', month: 'short', day: 'numeric' 
                  })}
                </div>
              ))}
              {previewDates.length > 5 && (
                <div className="text-gray-400">...and {previewDates.length - 5} more</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to generate recurring dates
export function generateRecurringDates(
  startDate: string,
  repeatEnabled: boolean,
  repeatType: string,
  repeatEnd: string,
  repeatEndCount: number,
  repeatEndDate: string,
  customInterval: number
): string[] {
  if (!repeatEnabled || !startDate) return [startDate]
  
  const dates: string[] = []
  const start = new Date(startDate + 'T12:00:00')

  // "Never" = through end of next year, "after" = specific count
  const endOfNextYear = new Date(start.getFullYear() + 1, 11, 31)
  const maxDates = repeatEnd === 'after' ? repeatEndCount : 500 // high cap, date limit will stop it
  const endDate = repeatEnd === 'never'
    ? endOfNextYear
    : (repeatEnd === 'on_date' && repeatEndDate ? new Date(repeatEndDate + 'T12:00:00') : null)
  
  let current = new Date(start)
  
  // For monthly_day, we need special handling
  if (repeatType === 'monthly_day') {
    const targetDay = start.getDay() // 0-6
    const targetWeek = Math.ceil(start.getDate() / 7) // 1-5

    let month = start.getMonth()
    let year = start.getFullYear()

    while (dates.length < maxDates) {
      // Find the Nth occurrence of the target day in this month
      const firstOfMonth = new Date(year, month, 1)
      let firstOccurrence = 1
      while (new Date(year, month, firstOccurrence).getDay() !== targetDay) {
        firstOccurrence++
      }
      const targetDate = firstOccurrence + (targetWeek - 1) * 7
      const lastDay = new Date(year, month + 1, 0).getDate()

      if (targetDate <= lastDay) {
        const date = new Date(year, month, targetDate)
        if (date >= start) {
          if (endDate && date > endDate) break
          dates.push(date.toISOString().split('T')[0])
        }
      }

      month++
      if (month > 11) { month = 0; year++ }
    }
    return dates
  }
  
  // For other types
  while (dates.length < maxDates) {
    if (endDate && current > endDate) break
    dates.push(current.toISOString().split('T')[0])
    
    switch (repeatType) {
      case 'daily':
        current.setDate(current.getDate() + 1)
        break
      case 'weekly':
        current.setDate(current.getDate() + 7)
        break
      case 'biweekly':
        current.setDate(current.getDate() + 14)
        break
      case 'triweekly':
        current.setDate(current.getDate() + 21)
        break
      case 'monthly_date':
        current.setMonth(current.getMonth() + 1)
        break
      case 'custom':
        current.setDate(current.getDate() + (customInterval * 7)) // weeks, not days
        break
      default:
        current.setDate(current.getDate() + 7)
    }
  }
  
  return dates
}

// Helper to get display name for recurring type
export function getRecurringDisplayName(
  repeatType: string,
  startDate: string
): string | null {
  if (!startDate) return null
  
  const date = new Date(startDate + 'T12:00:00')
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayName = dayNames[date.getDay()]
  const weekNum = Math.ceil(date.getDate() / 7)
  const weekNames = ['1st', '2nd', '3rd', '4th', '5th']
  
  switch (repeatType) {
    case 'daily': return 'Daily'
    case 'weekly': return 'Weekly'
    case 'biweekly': return 'Bi-weekly'
    case 'triweekly': return 'Tri-weekly'
    case 'monthly_date': return 'Monthly'
    case 'monthly_day': return `${weekNames[weekNum-1]} ${dayName}`
    case 'custom': return 'Custom'
    default: return null
  }
}
