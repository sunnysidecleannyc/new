'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import TranslatedNotes from '@/components/TranslatedNotes'
import PushPrompt from '@/components/PushPrompt'

const CleanerJobsMap = dynamic(() => import('@/components/CleanerJobsMap'), {
  ssr: false,
  loading: () => <div className="h-[250px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">Loading map...</div>
})

interface Booking {
  id: string
  start_time: string
  end_time: string
  service_type: string
  notes: string | null
  status: string
  check_in_time: string | null
  check_out_time: string | null
  cleaner_token: string
  cleaner_pay_rate?: number
  clients: {
    name: string
    phone: string
    address: string
    notes: string | null
  } | null
}

interface AvailableJob {
  id: string
  start_time: string
  end_time: string
  service_type: string
  notes: string | null
  cleaner_pay_rate: number | null
  clients: {
    name: string
    phone: string
    address: string
    notes: string | null
  } | null
}

interface Earnings {
  hourlyRate: number
  todayPotentialHours: number
  todayPotentialPay: number
  weeklyHours: number
  weeklyPay: number
  monthlyHours: number
  monthlyPay: number
  yearlyHours: number
  yearlyPay: number
  weekJobsCount: number
  monthJobsCount: number
  yearJobsCount: number
}

interface Schedule {
  [day: string]: { start: string; end: string } | null
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM'
]

export default function TeamDashboardPage() {
  useEffect(() => { document.title = 'My Schedule | The NYC Maid' }, []);
  const [cleanerName, setCleanerName] = useState('')
  const [cleanerId, setCleanerId] = useState('')
  const [todayJobs, setTodayJobs] = useState<Booking[]>([])
  const [upcomingJobs, setUpcomingJobs] = useState<Booking[]>([])
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([])
  const [earnings, setEarnings] = useState<Earnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [workingDays, setWorkingDays] = useState<string[]>([])
  const [schedule, setSchedule] = useState<Schedule>({})
  const [unavailableDates, setUnavailableDates] = useState<string[]>([])
  const [newDateOff, setNewDateOff] = useState('')
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [availabilitySaved, setAvailabilitySaved] = useState(false)
  const [showMap, setShowMap] = useState(true)
  const [showAvailability, setShowAvailability] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const id = localStorage.getItem('cleaner_id')
    const name = localStorage.getItem('cleaner_name')

    if (!id) {
      router.push('/team')
      return
    }

    setCleanerId(id)
    setCleanerName(name || 'Team Member')
    loadJobs(id)
    loadAvailableJobs()
    loadAvailability(id)
  }, [router])

  const loadJobs = async (id: string) => {
    const res = await fetch(`/api/team/jobs?cleaner_id=${id}`)
    if (res.ok) {
      const data = await res.json()
      setTodayJobs(data.today)
      setUpcomingJobs(data.upcoming)
      setEarnings(data.earnings)
      setShowMap(data.today.length > 0 || data.upcoming.length > 0)
    }
    setLoading(false)
  }

  const loadAvailableJobs = async () => {
    const res = await fetch('/api/team/available-jobs')
    if (res.ok) {
      setAvailableJobs(await res.json())
    }
  }

  const claimJob = async (jobId: string) => {
    setClaiming(jobId)
    const res = await fetch('/api/team/available-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, cleaner_id: cleanerId })
    })
    const data = await res.json()
    if (res.ok) {
      alert(data.message)
      loadJobs(cleanerId)
      loadAvailableJobs()
    } else {
      alert(data.error)
    }
    setClaiming(null)
  }

  const loadAvailability = async (id: string) => {
    const res = await fetch(`/api/team/availability?cleaner_id=${id}`)
    if (res.ok) {
      const data = await res.json()
      setWorkingDays(data.working_days || [])
      setSchedule(data.schedule || {})
      setUnavailableDates(data.unavailable_dates || [])
      if (data.photo_url) setPhotoUrl(data.photo_url)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('cleaner_id', cleanerId)
      const res = await fetch('/api/cleaners/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setPhotoUrl(data.url)
      } else {
        alert('Failed to upload photo / Error al subir la foto')
      }
    } catch {
      alert('Failed to upload photo / Error al subir la foto')
    }
    setUploadingPhoto(false)
  }

  const saveAvailability = async () => {
    setSavingAvailability(true)
    setAvailabilitySaved(false)
    const res = await fetch('/api/team/availability', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cleaner_id: cleanerId,
        working_days: workingDays,
        schedule,
        unavailable_dates: unavailableDates
      })
    })
    if (res.ok) {
      setAvailabilitySaved(true)
      setTimeout(() => setAvailabilitySaved(false), 3000)
    } else {
      alert('Error saving / Error al guardar')
    }
    setSavingAvailability(false)
  }

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day))
      setSchedule({ ...schedule, [day]: null })
    } else {
      setWorkingDays([...workingDays, day])
      setSchedule({ ...schedule, [day]: { start: '9:00 AM', end: '5:00 PM' } })
    }
  }

  const updateSchedule = (day: string, field: 'start' | 'end', value: string) => {
    const current = schedule[day] || { start: '9:00 AM', end: '5:00 PM' }
    setSchedule({
      ...schedule,
      [day]: {
        start: field === 'start' ? value : current.start,
        end: field === 'end' ? value : current.end
      }
    })
  }

  const addDateOff = () => {
    if (!newDateOff) return
    const today = new Date().toISOString().split('T')[0]
    if (newDateOff < today) return
    if (!unavailableDates.includes(newDateOff)) {
      setUnavailableDates([...unavailableDates, newDateOff].sort())
    }
    setNewDateOff('')
  }

  const removeDateOff = (date: string) => {
    setUnavailableDates(unavailableDates.filter(d => d !== date))
  }

  const handleLogout = () => {
    localStorage.removeItem('cleaner_id')
    localStorage.removeItem('cleaner_name')
    router.push('/team')
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading... / Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1E2A4A] text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-80">The NYC Maid</p>
            <h1 className="text-xl font-semibold">{cleanerName}</h1>
          </div>
          <button onClick={handleLogout} className="text-sm opacity-80 hover:opacity-100">
            Log out / Salir
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Push Notifications */}
        {cleanerId && (
          <div className="mb-4">
            <PushPrompt role="cleaner" userId={cleanerId} />
          </div>
        )}

        {/* My Rate */}
        {earnings && (
          <div className="mb-4 bg-[#1E2A4A] text-white rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-sm opacity-80">My Rate / Mi Tarifa</p>
              <p className="text-3xl font-bold">${earnings.hourlyRate}<span className="text-lg font-normal">/hr</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Paid via</p>
              <p className="text-lg font-semibold">Zelle / Apple Pay</p>
              <p className="text-xs opacity-70">hi@thenycmaid.com</p>
            </div>
          </div>
        )}

        {/* Today's Potential */}
        {earnings && todayJobs.length > 0 && (
          <div className="mb-4 bg-[#A8F0DC]/20 border border-[#A8F0DC]/30 rounded-xl p-4">
            <p className="text-sm text-[#1E2A4A]/70 font-medium">Today / Hoy</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-[#1E2A4A]">${earnings.todayPotentialPay.toFixed(0)}</p>
                <p className="text-xs text-[#1E2A4A]">{earnings.todayPotentialHours}hrs scheduled · {todayJobs.length} job{todayJobs.length > 1 ? 's' : ''}</p>
              </div>
              <p className="text-xs text-[#1E2A4A]">Complete all to earn ↑</p>
            </div>
          </div>
        )}

        {/* Earnings Summary */}
        {earnings && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
            <h2 className="text-sm font-medium text-green-800 mb-3">💰 Earnings / Ganancias</h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                <p className="text-xs text-gray-500">Week</p>
                <p className="text-xl font-bold text-green-700">${earnings.weeklyPay.toFixed(0)}</p>
                <p className="text-xs text-gray-400">{earnings.weeklyHours}hrs</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                <p className="text-xs text-gray-500">Month</p>
                <p className="text-xl font-bold text-green-700">${earnings.monthlyPay.toFixed(0)}</p>
                <p className="text-xs text-gray-400">{earnings.monthlyHours}hrs</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                <p className="text-xs text-gray-500">Year</p>
                <p className="text-xl font-bold text-green-700">${earnings.yearlyPay.toFixed(0)}</p>
                <p className="text-xs text-gray-400">{earnings.yearlyHours}hrs</p>
              </div>
            </div>
          </div>
        )}

        {/* My Jobs Map */}
        <div className="mb-6">
          <button
            onClick={() => setShowMap(!showMap)}
            className="w-full flex justify-between items-center bg-white border border-gray-200 rounded-xl p-4"
          >
            <span className="font-semibold text-[#1E2A4A]">My Jobs Map / Mapa de Trabajos</span>
            <span className="text-gray-400">{showMap ? '▲' : '▼'}</span>
          </button>

          {showMap && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl p-3">
              <CleanerJobsMap
                jobs={[...todayJobs, ...upcomingJobs].map(job => ({
                  id: job.id,
                  address: job.clients?.address || '',
                  clientName: job.clients?.name || 'Unknown',
                  time: `${new Date(job.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ${new Date(job.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
                  status: job.check_out_time ? 'done' as const : job.check_in_time ? 'in_progress' as const : 'upcoming' as const,
                }))}
              />
              <div className="flex items-center gap-4 mt-2 px-1">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-500">Upcoming</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-500">In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-xs text-gray-500">Done</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* My Availability */}
        <div className="mb-6">
          <button
            onClick={() => setShowAvailability(!showAvailability)}
            className="w-full flex justify-between items-center bg-white border border-gray-200 rounded-xl p-4"
          >
            <span className="font-semibold text-[#1E2A4A]">My Availability / Mi Disponibilidad</span>
            <span className="text-gray-400">{showAvailability ? '▲' : '▼'}</span>
          </button>

          {showAvailability && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl p-4 space-y-4">
              {/* Day toggles */}
              <div>
                <p className="text-sm font-medium text-[#1E2A4A] mb-2">Working Days / Días Laborales</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        workingDays.includes(day)
                          ? 'bg-[#1E2A4A] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Per-day times */}
              {workingDays.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#1E2A4A]">Hours / Horario</p>
                  {DAYS.filter(d => workingDays.includes(d)).map(day => (
                    <div key={day} className="flex items-center gap-2">
                      <span className="w-10 text-sm font-medium text-[#1E2A4A]">{day}</span>
                      <select
                        value={schedule[day]?.start || '9:00 AM'}
                        onChange={(e) => updateSchedule(day, 'start', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm text-[#1E2A4A] bg-white"
                      >
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span className="text-gray-400 text-sm">to</span>
                      <select
                        value={schedule[day]?.end || '5:00 PM'}
                        onChange={(e) => updateSchedule(day, 'end', e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm text-[#1E2A4A] bg-white"
                      >
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Days off */}
              <div>
                <p className="text-sm font-medium text-[#1E2A4A] mb-2">Days Off / Días Libres</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="date"
                    value={newDateOff}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewDateOff(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[#1E2A4A]"
                  />
                  <button
                    type="button"
                    onClick={addDateOff}
                    className="px-4 py-2 bg-gray-100 text-[#1E2A4A] rounded-lg font-medium hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
                {unavailableDates.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {unavailableDates.map(date => (
                      <span key={date} className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <button onClick={() => removeDateOff(date)} className="ml-1 text-red-400 hover:text-red-600 font-bold">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Save */}
              <button
                onClick={saveAvailability}
                disabled={savingAvailability}
                className="w-full py-3 bg-[#1E2A4A] text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {savingAvailability ? 'Saving... / Guardando...' : availabilitySaved ? 'Saved! / Guardado!' : 'Save Availability / Guardar Disponibilidad'}
              </button>
            </div>
          )}
        </div>

        {/* My Photo */}
        <div className="mb-6">
          <button
            onClick={() => setShowPhoto(!showPhoto)}
            className="w-full flex justify-between items-center bg-white border border-gray-200 rounded-xl p-4"
          >
            <span className="font-semibold text-[#1E2A4A]">My Photo / Mi Foto</span>
            <span className="text-gray-400">{showPhoto ? '▲' : '▼'}</span>
          </button>

          {showPhoto && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex flex-col items-center gap-4">
                {photoUrl ? (
                  <img src={photoUrl} alt="My photo" className="w-24 h-24 rounded-full object-cover border-2 border-gray-300" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-3xl text-gray-400">📷</span>
                  </div>
                )}
                <p className="text-sm text-gray-500 text-center">
                  {photoUrl ? 'Clients see this photo / Los clientes ven esta foto' : 'Upload a smiling photo / Sube una foto sonriendo'}
                </p>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-4 py-2 bg-[#1E2A4A] text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {uploadingPhoto ? 'Uploading... / Subiendo...' : photoUrl ? 'Change Photo / Cambiar Foto' : 'Upload Photo / Subir Foto'}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePhotoUpload(file)
                    e.target.value = ''
                  }}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-6 flex gap-2">
          <a href="tel:2122028400" className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-center font-medium text-[#1E2A4A]">
            📞 Call Office
          </a>
          <a href="sms:2122028400" className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-center font-medium text-[#1E2A4A]">
            💬 Text Office
          </a>
        </div>

        {/* Available Jobs - Emergency/Same Day */}
        {availableJobs.length > 0 && (
          <div className="mb-6">
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 animate-pulse">
              <h2 className="text-lg font-bold text-red-700 mb-3">🚨 Available Now / Disponible Ahora ({availableJobs.length})</h2>
              <p className="text-sm text-red-600 mb-4">First to claim gets it! / ¡El primero en reclamar lo obtiene!</p>
              <div className="space-y-3">
                {availableJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-[#1E2A4A]">{new Date(job.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        <p className="text-gray-600">{new Date(job.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(job.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">${job.cleaner_pay_rate || 40}/hr</p>
                        <p className="text-xs text-green-600">Premium Rate!</p>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-1">{job.clients?.name}</p>
                    <p className="text-sm text-gray-500 mb-3">{job.clients?.address}</p>
                    {(job.clients?.notes || job.notes) && (
                      <div className="text-sm text-[#1E2A4A]/70 bg-[#A8F0DC]/20 p-2 rounded mb-3">
                        <TranslatedNotes text={[job.clients?.notes, job.notes].filter(Boolean).join('\n\n')} label="Notes / Notas" />
                      </div>
                    )}
                    <button
                      onClick={() => claimJob(job.id)}
                      disabled={claiming === job.id}
                      className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {claiming === job.id ? 'Claiming... / Reclamando...' : '🙋 CLAIM THIS JOB / RECLAMAR'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Today's Jobs */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#1E2A4A] mb-3">Today / Hoy ({todayJobs.length})</h2>
          {todayJobs.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500 border border-gray-200">
              No jobs scheduled for today / No hay trabajos para hoy
            </div>
          ) : (
            <div className="space-y-3">
              {todayJobs.map((job) => (
                <JobCard key={job.id} job={job} onUpdate={() => loadJobs(cleanerId)} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Jobs */}
        <div>
          <h2 className="text-lg font-semibold text-[#1E2A4A] mb-3">Upcoming / Próximos</h2>
          {upcomingJobs.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500 border border-gray-200">
              No upcoming jobs / No hay trabajos próximos
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingJobs.map((job) => (
                <JobCard key={job.id} job={job} onUpdate={() => loadJobs(cleanerId)} showDate />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function JobCard({ job, onUpdate, showDate }: { job: Booking; onUpdate: () => void; showDate?: boolean }) {
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  const handleCheckIn = async () => {
    setCheckingIn(true)
    const location = await getLocation()
    await fetch(`/api/team/${job.cleaner_token}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location })
    })
    onUpdate()
    setCheckingIn(false)
  }

  const handleCheckOut = async () => {
    setCheckingOut(true)
    const location = await getLocation()
    await fetch(`/api/team/${job.cleaner_token}/check-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location })
    })
    onUpdate()
    setCheckingOut(false)
  }

  const isCheckedIn = !!job.check_in_time
  const isCheckedOut = !!job.check_out_time

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex justify-between items-start">
          <div>
            {showDate && <p className="text-sm text-gray-500 mb-1">{formatDate(job.start_time)}</p>}
            <p className="font-semibold text-[#1E2A4A]">{formatTime(job.start_time)} - {formatTime(job.end_time)}</p>
            <p className="text-gray-600">{job.clients?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {isCheckedOut ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Done / Listo</span>
            ) : isCheckedIn ? (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">In Progress / En Progreso</span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Upcoming / Próximo</span>
            )}
            <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Address / Dirección</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(job.clients?.address || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1E2A4A] underline"
              >
                {job.clients?.address || 'N/A'}
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone / Teléfono</p>
              <a href={`tel:${job.clients?.phone}`} className="text-[#1E2A4A] underline">
                {job.clients?.phone || 'N/A'}
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-500">Service / Servicio</p>
              <p className="text-[#1E2A4A]">{job.service_type}</p>
            </div>
            {/* Notes - combined client + admin */}
            {(() => {
              const allNotes = [job.clients?.notes, job.notes].filter(Boolean).join('\n\n')
              return (
                <div className={`p-4 rounded-xl border-2 ${allNotes ? 'bg-[#A8F0DC]/20 border-[#A8F0DC]/30' : 'bg-gray-50 border-gray-200'}`}>
                  {allNotes ? (
                    <TranslatedNotes text={allNotes} label="Notes / Notas" />
                  ) : (
                    <>
                      <p className="text-sm font-semibold mb-1 text-[#1E2A4A]">Notes / Notas</p>
                      <p className="text-base text-gray-400 italic">No notes / Sin notas</p>
                    </>
                  )}
                </div>
              )
            })()}

            {/* Status */}
            {isCheckedIn && (
              <p className="text-green-600 text-sm">✓ Checked in at / Entrada a las {formatTime(job.check_in_time!)}</p>
            )}
            {isCheckedOut && (
              <p className="text-green-600 text-sm">✓ Checked out at / Salida a las {formatTime(job.check_out_time!)}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(job.clients?.address || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-gray-100 text-[#1E2A4A] text-center font-medium rounded-lg text-sm"
              >
                📍 Navigate
              </a>
              <a
                href={`tel:${job.clients?.phone}`}
                className="flex-1 py-2 bg-gray-100 text-[#1E2A4A] text-center font-medium rounded-lg text-sm"
              >
                📞 Call
              </a>
              <a
                href={`sms:${job.clients?.phone}`}
                className="flex-1 py-2 bg-gray-100 text-[#1E2A4A] text-center font-medium rounded-lg text-sm"
              >
                💬 Text
              </a>
            </div>

            {/* Check In/Out */}
            {!isCheckedIn && !isCheckedOut && (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {checkingIn ? 'Checking In... / Registrando...' : 'Check In / Registrar Entrada'}
              </button>
            )}
            {isCheckedIn && !isCheckedOut && (
              <button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {checkingOut ? 'Checking Out... / Registrando...' : 'Check Out / Registrar Salida'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
