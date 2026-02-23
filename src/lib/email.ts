import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY?.replace(/\s/g, ''))

export async function sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
  const maxRetries = 3
  const delays = [1000, 2000, 4000]

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'The NYC Maid <hello@thenycmaid.com>',
        to,
        subject,
        html,
        attachments
      })
      if (error) {
        // Don't retry validation errors (bad email, etc)
        if (error.message?.includes('validation') || error.message?.includes('invalid')) {
          console.error('Email validation error:', error)
          return { success: false, error }
        }
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, delays[attempt]))
          continue
        }
        console.error('Email error after retries:', error)
        return { success: false, error }
      }
      return { success: true, data }
    } catch (err) {
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delays[attempt]))
        continue
      }
      console.error('Email exception after retries:', err)
      return { success: false, error: err }
    }
  }
  return { success: false, error: 'Max retries exceeded' }
}
