// ============================================
// SMS TEMPLATES — Short text versions of emails
// All messages end with opt-out info per TCPA
// ============================================

const STOP_TEXT = '\nReply STOP to opt out.'
const STOP_TEXT_ES = '\nResponde STOP para cancelar.'

// ============================================
// CLIENT SMS
// ============================================

export function smsBookingConfirmation(booking: any): string {
  const date = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const time = new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const cleanerName = booking.cleaners?.name?.split(' ')[0] || 'Your cleaner'
  return `NYC Maid: Your cleaning is confirmed for ${date} at ${time} with ${cleanerName}. Details: thenycmaid.com/book${STOP_TEXT}`
}

export function smsReminder(booking: any, timeframe: string): string {
  const time = new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const cleanerName = booking.cleaners?.name?.split(' ')[0] || 'Your cleaner'
  if (timeframe === 'in 2 hours') {
    return `NYC Maid: Reminder — ${cleanerName} arrives at ${time}. Almost time!${STOP_TEXT}`
  }
  return `NYC Maid: Reminder — cleaning ${timeframe} at ${time} with ${cleanerName}.${STOP_TEXT}`
}

export function smsCancellation(booking: any): string {
  const date = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return `NYC Maid: Your ${date} cleaning has been cancelled. Rebook: thenycmaid.com/book${STOP_TEXT}`
}

export function smsReschedule(booking: any): string {
  const newDate = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const newTime = new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `NYC Maid: Your cleaning has been rescheduled to ${newDate} at ${newTime}. Details: thenycmaid.com/book${STOP_TEXT}`
}

export function smsThankYou(clientName: string): string {
  const firstName = clientName?.split(' ')[0] || 'there'
  return `NYC Maid: Thanks ${firstName}! Enjoy 10% off your next booking. Book: thenycmaid.com/book${STOP_TEXT}`
}

export function smsVerificationCode(code: string): string {
  return `NYC Maid: Your code is ${code}. Expires in 10 min.`
}

// ============================================
// CLIENT SMS (Spanish)
// ============================================

export function smsBookingConfirmationES(booking: any): string {
  const date = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const time = new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const cleanerName = booking.cleaners?.name?.split(' ')[0] || 'Tu limpiador/a'
  return `NYC Maid: Tu limpieza está confirmada para ${date} a las ${time} con ${cleanerName}. Detalles: thenycmaid.com/book${STOP_TEXT_ES}`
}

export function smsReminderES(booking: any, timeframe: string): string {
  const time = new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const cleanerName = booking.cleaners?.name?.split(' ')[0] || 'Tu limpiador/a'
  const tfMap: Record<string, string> = {
    'in 2 hours': 'en 2 horas',
    'tomorrow': 'mañana',
    'in 1 hour': 'en 1 hora',
  }
  const tfES = tfMap[timeframe] || timeframe
  if (timeframe === 'in 2 hours') {
    return `NYC Maid: Recordatorio — ${cleanerName} llega a las ${time}. ¡Ya casi!${STOP_TEXT_ES}`
  }
  return `NYC Maid: Recordatorio — limpieza ${tfES} a las ${time} con ${cleanerName}.${STOP_TEXT_ES}`
}

export function smsCancellationES(booking: any): string {
  const date = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return `NYC Maid: Tu limpieza del ${date} ha sido cancelada. Reservar de nuevo: thenycmaid.com/book${STOP_TEXT_ES}`
}

export function smsRescheduleES(booking: any): string {
  const newDate = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const newTime = new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `NYC Maid: Tu limpieza ha sido reprogramada para ${newDate} a las ${newTime}. Detalles: thenycmaid.com/book${STOP_TEXT_ES}`
}

export function smsThankYouES(clientName: string): string {
  const firstName = clientName?.split(' ')[0] || ''
  return `NYC Maid: ¡Gracias ${firstName}! Disfruta 10% de descuento en tu próxima reserva. Reservar: thenycmaid.com/book${STOP_TEXT_ES}`
}

// ============================================
// CLEANER SMS (Bilingual EN/ES)
// ============================================

export function smsJobAssignment(booking: any): string {
  const date = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const time = new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `NYC Maid: New job ${date} ${time} - ${booking.clients?.name || 'Client'}. Check portal: thenycmaid.com/team\nNuevo trabajo ${date} ${time}. Ver portal: thenycmaid.com/team${STOP_TEXT}`
}

export function smsDailySummary(cleanerName: string, count: number): string {
  const firstName = cleanerName.split(' ')[0]
  return `NYC Maid: Hi ${firstName}, you have ${count} job${count === 1 ? '' : 's'} tomorrow. Check portal: thenycmaid.com/team\nHola ${firstName}, tienes ${count} trabajo${count === 1 ? '' : 's'} mañana. Ver: thenycmaid.com/team${STOP_TEXT}`
}

export function smsJobCancelled(booking: any): string {
  const date = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return `NYC Maid: Cancelled - ${date} job (${booking.clients?.name || 'Client'}). Check portal: thenycmaid.com/team\nCancelado - trabajo del ${date}. Ver: thenycmaid.com/team${STOP_TEXT}`
}

export function smsJobRescheduled(booking: any): string {
  const newDate = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const newTime = new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `NYC Maid: Rescheduled - ${booking.clients?.name || 'Client'} moved to ${newDate} ${newTime}. Portal: thenycmaid.com/team\nReprogramado al ${newDate} ${newTime}. Ver: thenycmaid.com/team${STOP_TEXT}`
}

export function smsUrgentBroadcast(booking: any): string {
  const date = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const time = new Date(booking.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const payRate = booking.cleaner_pay_rate || 40
  return `NYC Maid URGENT: $${payRate}/hr job available ${date} ${time}. Claim now: thenycmaid.com/team\nURGENTE: Trabajo $${payRate}/hr ${date} ${time}. Reclamar: thenycmaid.com/team${STOP_TEXT}`
}

// ============================================
// CLIENT PAYMENT SMS
// ============================================

export function smsPaymentDue(clientName: string, amount: string): string {
  const firstName = clientName?.split(' ')[0] || 'there'
  return `NYC Maid: Hi ${firstName}, your cleaning is wrapping up soon! Payment of $${amount} is due via Zelle (hi@thenycmaid.com) or Apple Pay (2120292200). Our team can't leave until payment is processed — thank you!${STOP_TEXT}`
}

export function smsPaymentDueES(clientName: string, amount: string): string {
  const firstName = clientName?.split(' ')[0] || ''
  return `NYC Maid: Hola ${firstName}, tu limpieza está por terminar. El pago de $${amount} se puede hacer por Zelle (hi@thenycmaid.com) o Apple Pay (2120292200). Nuestro equipo no puede irse hasta que se procese el pago — ¡gracias!${STOP_TEXT_ES}`
}

// ============================================
// ADMIN SMS
// ============================================

export function smsPaymentDueAdmin(clientName: string, cleanerName: string, amount: string): string {
  return `NYC Maid: 15 min left — ${clientName} with ${cleanerName}. Collect $${amount} via Zelle/Apple Pay`
}

export function smsNewClient(name: string): string {
  return `NYC Maid: New client — ${name} via collect form`
}

export function smsNewBooking(booking: any): string {
  const date = new Date(booking.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return `NYC Maid: New booking — ${booking.clients?.name || 'Unknown'} on ${date}`
}

export function smsNewApplication(name: string): string {
  return `NYC Maid: New cleaner application — ${name}`
}

export function smsNewReferrer(name: string, code: string): string {
  return `NYC Maid: New referrer — ${name} (${code})`
}
