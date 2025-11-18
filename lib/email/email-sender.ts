import nodemailer from 'nodemailer'
import QRCode from 'qrcode'
import { render } from '@react-email/components'
import ConfirmationEmail from './templates/confirmation'
import { supabase } from '@/lib/supabase'
import path from 'path'
import fs from 'fs'

export interface EmailSenderConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  fromEmail: string
  fromName: string
}

export interface ConfirmationEmailData {
  to: string
  name: string
  qrCode: string
  event: {
    name: string
    nameEn?: string
    date: string
    time: string
    location: string
    locationEn?: string
  }
  confirmationGuid: string
  confirmationLink: string
  inviteImageUrl?: string
  inviteImagePath?: string
  eventId?: number
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export class EmailSender {
  private transporter: nodemailer.Transporter
  private fromEmail: string
  private fromName: string

  constructor(config: EmailSenderConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for other ports
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    })
    this.fromEmail = config.fromEmail
    this.fromName = config.fromName
  }

  /**
   * Generate QR Code as base64 data URL
   */
  private async generateQRCodeBase64(text: string): Promise<string> {
    try {
      const qrCodeBuffer = await QRCode.toBuffer(text, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      return `data:image/png;base64,${qrCodeBuffer.toString('base64')}`
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Format date string to Brazilian format
   */
  private formatDate(dateString: string | null | undefined): string {
    if (!dateString) return ''

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString

      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateString || ''
    }
  }

  /**
   * Extract time from date string
   */
  private extractTime(dateString: string | null | undefined): string {
    if (!dateString) return '18:30'

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return '18:30'

      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      })
    } catch {
      return '18:30'
    }
  }

  /**
   * Log email sent to database
   */
  private async logEmailSent(
    guestId: number | null,
    recipientEmail: string,
    recipientName: string,
    subject: string,
    status: 'sent' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('email_logs').insert({
        guest_id: guestId,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: subject,
        status: status,
        error_message: errorMessage || null,
        sent_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Error logging email:', error)
      }
    } catch (error) {
      console.error('Error saving email log:', error)
    }
  }

  /**
   * Send confirmation email with QR code
   */
  async sendConfirmationEmail(
    data: ConfirmationEmailData,
    guestId?: number
  ): Promise<EmailResult> {
    const subject = `Sua presença está confirmada! - ${data.event.name}`

    console.log(`📧 [Email] Preparing to send confirmation email`)
    console.log(`   → Recipient: ${data.to}`)
    console.log(`   → Guest Name: ${data.name}`)
    console.log(`   → Guest ID: ${guestId || 'N/A'}`)
    console.log(`   → Event: ${data.event.name}`)
    console.log(`   → Invite Image URL: ${data.inviteImageUrl || 'N/A'}`)

    try {
      // Format date
      const formattedDate = this.formatDate(data.event.date)

      // Render email template
      const emailHtml = await render(
        ConfirmationEmail({
          guestName: data.name,
          eventName: data.event.name,
          eventNameEn: data.event.nameEn,
          eventDate: formattedDate,
          eventTime: data.event.time,
          eventLocation: data.event.location,
          eventLocationEn: data.event.locationEn,
          qrCodeBase64: '', // Not used anymore, but kept for compatibility
          qrCodeText: data.qrCode,
          confirmationLink: data.confirmationLink,
          inviteImageUrl: data.inviteImageUrl,
        })
      )

      // Prepare attachments
      const attachments: any[] = []

      // Add invite image from database or filesystem
      if (data.inviteImagePath && data.eventId) {
        console.log(`📎 [Email] Checking for invite image attachment`)

        // First, try to get image from database (base64)
        const { data: guestData, error: fetchError } = await supabase
          .from('guests')
          .select('invite_image_base64')
          .eq('qr_code', data.qrCode)
          .eq('event_id', data.eventId)
          .single()

        if (!fetchError && guestData?.invite_image_base64) {
          console.log(`   → Found image in database (base64)`)

          // Extract mime type and base64 data from data URI
          const matches = guestData.invite_image_base64.match(/^data:([^;]+);base64,(.+)$/)
          if (matches) {
            const mimeType = matches[1]
            const base64Data = matches[2]
            const buffer = Buffer.from(base64Data, 'base64')

            // Determine file extension from mime type
            const ext = mimeType === 'image/png' ? 'png' : 'jpg'

            attachments.push({
              filename: `convite-${data.qrCode}.${ext}`,
              content: buffer,
              contentType: mimeType
            })
            console.log(`   → Attachment added from database: convite-${data.qrCode}.${ext}`)
          } else {
            console.log(`   → Warning: Invalid base64 data URI format`)
          }
        } else {
          // Fallback to filesystem (for backward compatibility)
          console.log(`   → Image not in database, checking filesystem`)

          let eventSlug: string
          let extensions: string[]

          // Event ID 7 = Festa de Fim de Ano (try both PNG and JPG)
          if (data.eventId === 7) {
            eventSlug = 'festa-equinor'
            extensions = ['png', 'jpg'] // Try both formats
          } else {
            // Event ID 1 = Rio, Event ID 2 = São Paulo (JPG files)
            eventSlug = data.eventId === 2 ? 'oil-celebration-sp' : 'oil-celebration-rj'
            extensions = ['jpg']
          }

          // Try each extension until we find a file
          let fileFound = false
          for (const ext of extensions) {
            const imagePath = path.join(process.cwd(), 'public', 'events', eventSlug, `${data.qrCode}-${eventSlug}.${ext}`)
            console.log(`   → Checking path: ${imagePath}`)

            if (fs.existsSync(imagePath)) {
              attachments.push({
                filename: `convite-${data.qrCode}.${ext}`,
                path: imagePath,
                contentType: ext === 'png' ? 'image/png' : 'image/jpeg'
              })
              console.log(`   → Attachment added from filesystem: convite-${data.qrCode}.${ext}`)
              fileFound = true
              break
            }
          }

          if (!fileFound) {
            console.log(`   → Warning: Image file not found in database or filesystem, skipping attachment`)
          }
        }
      }

      // Send email via SMTP
      console.log(`📤 [Email] Sending email via SMTP...`)
      const info = await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: data.to,
        subject: subject,
        html: emailHtml,
        attachments: attachments.length > 0 ? attachments : undefined,
      })

      // Log success
      await this.logEmailSent(
        guestId || null,
        data.to,
        data.name,
        subject,
        'sent'
      )

      console.log(`✅ [Email] Email sent successfully`)
      console.log(`   → Recipient: ${data.to}`)
      console.log(`   → Message ID: ${info.messageId || 'N/A'}`)
      console.log(`   → Logged to database: Yes`)

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error'
      console.error(`❌ [Email] Failed to send email`)
      console.error(`   → Recipient: ${data.to}`)
      console.error(`   → Error: ${errorMessage}`)
      console.error(`   → Full error:`, error)

      // Log failure
      await this.logEmailSent(
        guestId || null,
        data.to,
        data.name,
        subject,
        'failed',
        errorMessage
      )

      console.log(`   → Logged failure to database: Yes`)

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Send confirmation email with retry logic
   */
  async sendConfirmationEmailWithRetry(
    data: ConfirmationEmailData,
    guestId?: number,
    maxRetries: number = 1
  ): Promise<EmailResult> {
    let lastError: string | undefined

    console.log(`🔄 [Email] Starting email send with retry (max attempts: ${maxRetries + 1})`)

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(`🔁 [Email] Retry attempt ${attempt}/${maxRetries}`)
        console.log(`   → Waiting 2 seconds before retry...`)
        // Wait 2 seconds before retry
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } else {
        console.log(`🎯 [Email] Attempt 1/${maxRetries + 1}`)
      }

      const result = await this.sendConfirmationEmail(data, guestId)

      if (result.success) {
        if (attempt > 0) {
          console.log(`✅ [Email] Email sent successfully on retry attempt ${attempt}`)
        }
        return result
      }

      lastError = result.error
      console.log(`⚠️  [Email] Attempt ${attempt + 1} failed: ${lastError}`)
    }

    console.error(`❌ [Email] All retry attempts exhausted. Email not sent.`)
    console.error(`   → Total attempts: ${maxRetries + 1}`)
    console.error(`   → Last error: ${lastError}`)

    return {
      success: false,
      error: lastError || 'Failed after retries',
    }
  }
}

/**
 * Generate invite image URL based on event and QR code
 * Note: For Event ID 7, the actual file format (png or jpg) will be determined at runtime
 */
export function getInviteImageUrl(eventId: number, qrCode: string, siteUrl?: string): string {
  const baseUrl = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || ''

  let eventSlug: string
  let fileExtension: string

  // Event ID 7 = Festa de Fim de Ano (default to png, but will try both at runtime)
  if (eventId === 7) {
    eventSlug = 'festa-equinor'
    fileExtension = 'png' // Default, but both png and jpg will be tried
  } else {
    // Event ID 1 = Rio de Janeiro, Event ID 2 = São Paulo (JPG files)
    eventSlug = eventId === 2 ? 'oil-celebration-sp' : 'oil-celebration-rj'
    fileExtension = 'jpg'
  }

  return `${baseUrl}/events/${eventSlug}/${qrCode}-${eventSlug}.${fileExtension}`
}

/**
 * Get event English translations based on event ID
 */
export function getEventEnglishTranslation(eventId: number, eventName: string, location: string) {
  // Event ID 1 = Rio de Janeiro, Event ID 2 = São Paulo, Event ID 7 = Festa de Fim de Ano
  // Default translations for known events
  const translations: Record<number, { nameEn: string; locationEn: string }> = {
    1: {
      nameEn: 'Bacalhau First Oil Celebration',
      locationEn: 'Marina da Glória, Rio de Janeiro',
    },
    2: {
      nameEn: 'Bacalhau First Oil Celebration',
      locationEn: 'São Paulo',
    },
    7: {
      nameEn: 'End-of-year party',
      locationEn: 'Marina da Glória, Rio de Janeiro',
    },
  }

  return translations[eventId] || { nameEn: eventName, locationEn: location }
}

/**
 * Create EmailSender instance with environment variables
 */
export function createEmailSender(): EmailSender {
  const smtpHost = process.env.SMTP_SERVER
  const smtpPort = process.env.SMTP_PORT
  const smtpUsername = process.env.SMTP_USERNAME
  const smtpPassword = process.env.SMTP_PASSWORD
  const fromEmail = process.env.SMTP_SENDER
  const fromName = process.env.SMTP_FROM_NAME

  if (!smtpHost) {
    throw new Error('SMTP_SERVER environment variable is not set')
  }

  if (!smtpPort) {
    throw new Error('SMTP_PORT environment variable is not set')
  }

  if (!smtpUsername) {
    throw new Error('SMTP_USERNAME environment variable is not set')
  }

  if (!smtpPassword) {
    throw new Error('SMTP_PASSWORD environment variable is not set')
  }

  if (!fromEmail) {
    throw new Error('SMTP_SENDER environment variable is not set')
  }

  const port = parseInt(smtpPort, 10)
  const secure = port === 465 // Use SSL for port 465

  return new EmailSender({
    host: smtpHost,
    port: port,
    secure: secure,
    auth: {
      user: smtpUsername,
      pass: smtpPassword,
    },
    fromEmail: fromEmail,
    fromName: fromName || 'Confirmação de Presença',
  })
}
