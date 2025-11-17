import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components'
import * as React from 'react'

interface ConfirmationEmailProps {
  guestName: string
  eventName: string
  eventNameEn?: string
  eventDate: string
  eventTime: string
  eventLocation: string
  eventLocationEn?: string
  qrCodeBase64: string
  qrCodeText: string
  confirmationLink: string
  inviteImageUrl?: string
}

export const ConfirmationEmail = ({
  guestName = 'Convidado',
  eventName = 'Evento',
  eventNameEn,
  eventDate = '02/12/2024',
  eventTime = '18:30',
  eventLocation = 'Marina da Glória',
  eventLocationEn,
  qrCodeBase64 = '',
  qrCodeText = '3000',
  confirmationLink = '#',
  inviteImageUrl,
}: ConfirmationEmailProps) => {
  const previewText = `Sua presença está confirmada! - ${eventName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Presença Confirmada!</Heading>
          </Section>

          {/* Portuguese Section */}
          <Section style={section}>
            <Text style={greeting}>Olá {guestName},</Text>
            <Text style={paragraph}>
              Sua presença está confirmada para o evento <strong>{eventName}</strong>.
            </Text>
            <Text style={paragraph}>
              <strong>📅 Data:</strong> {eventDate}
              <br />
              <strong>⏰ Horário:</strong> {eventTime}
              <br />
              <strong>📍 Local:</strong> {eventLocation}
            </Text>
            <Text style={paragraph}>
              Para acessar o evento, apresente o QR Code abaixo na entrada:
            </Text>
          </Section>

          {/* Divider */}
          <Hr style={divider} />

          {/* English Section */}
          <Section style={section}>
            <Text style={greeting}>Hello {guestName},</Text>
            <Text style={paragraph}>
              Your attendance is confirmed for the event <strong>{eventNameEn || eventName}</strong>.
            </Text>
            <Text style={paragraph}>
              <strong>📅 Date:</strong> {eventDate}
              <br />
              <strong>⏰ Time:</strong> {eventTime}
              <br />
              <strong>📍 Location:</strong> {eventLocationEn || eventLocation}
            </Text>
            <Text style={paragraph}>
              To access the event, present the QR Code below at the entrance:
            </Text>
          </Section>

          {/* Invite Image Section */}
          <Section style={qrSection}>
            {inviteImageUrl && (
              <Img
                src={inviteImageUrl}
                alt="Convite / Invitation"
                width="600"
                style={inviteImage}
              />
            )}
            <Text style={qrCodeLabel}>Código de Confirmação / Confirmation Code</Text>
            <Text style={qrCodeValue}>{qrCodeText}</Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={divider} />
            <Text style={footerText}>
              Este é um email automático. Por favor, não responda.
              <br />
              This is an automated email. Please do not reply.
            </Text>
            <Text style={footerText}>
              <a href={confirmationLink} style={link}>
                Acessar meu convite / Access my invitation
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ConfirmationEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 48px',
  backgroundColor: '#FF1243',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const section = {
  padding: '0 48px',
}

const greeting = {
  fontSize: '18px',
  lineHeight: '1.5',
  marginBottom: '16px',
  color: '#243746',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#525f7f',
  marginBottom: '16px',
}

const qrSection = {
  textAlign: 'center' as const,
  padding: '32px 48px',
}

const qrImage = {
  margin: '0 auto',
  display: 'block',
  border: '2px solid #e6ebf1',
  borderRadius: '8px',
  padding: '16px',
}

const inviteImage = {
  margin: '0 auto',
  display: 'block',
  width: '100%',
  maxWidth: '600px',
  height: 'auto',
}

const qrCodeLabel = {
  fontSize: '14px',
  color: '#8898aa',
  marginTop: '16px',
  marginBottom: '8px',
}

const qrCodeValue = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#243746',
  letterSpacing: '2px',
  margin: '0',
}

const divider = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const footer = {
  padding: '0 48px',
}

const footerText = {
  fontSize: '14px',
  color: '#8898aa',
  lineHeight: '1.5',
  textAlign: 'center' as const,
  marginBottom: '8px',
}

const link = {
  color: '#FF1243',
  textDecoration: 'underline',
}
