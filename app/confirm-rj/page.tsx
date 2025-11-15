'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ConfirmRioContent() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [guestName, setGuestName] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
      handleAutoSubmit(emailParam)
    }
  }, [searchParams])

  const handleAutoSubmit = async (emailValue: string) => {
    if (!emailValue.trim()) {
      setError('Por favor, informe seu email')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch('/api/rsvp/confirm-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailValue.trim().toLowerCase(),
          eventId: 1
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao confirmar presença')
        return
      }

      setSuccess(true)
      setGuestName(data.guest.name)
    } catch (err) {
      console.error('Error:', err)
      setError('Erro ao conectar com o servidor. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleAutoSubmit(email)
  }

  const handleAccessInvite = () => {
    window.location.href = `/rsvp-rj?email=${encodeURIComponent(email)}`
  }

  if (loading) {
    return (
      <>
        <style jsx global>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
            color: #333;
          }
        `}</style>
        <div style={{ textAlign: 'center' }}>
          <p>Carregando...</p>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <style jsx global>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
            color: #333;
          }
        `}</style>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', maxWidth: '500px' }}>
          <h2 style={{ color: '#E31C23', marginBottom: '20px' }}>Erro</h2>
          <p style={{ marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 30px',
              backgroundColor: '#2C3E50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Tentar novamente
          </button>
        </div>
      </>
    )
  }

  if (!success) {
    return (
      <>
        <style jsx global>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
            color: #333;
          }
        `}</style>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', maxWidth: '500px' }}>
          <h2 style={{ marginBottom: '20px' }}>Confirmar Presença</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 30px',
                backgroundColor: '#2C3E50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Confirmar
            </button>
          </form>
        </div>
      </>
    )
  }

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          color: #333;
        }

        .container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
          overflow: hidden;
          animation: slideIn 0.4s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header-bar {
          height: 8px;
          background-color: #E31C23;
          width: 100%;
        }

        .content {
          padding: 50px 40px;
          text-align: center;
        }

        .logo {
          margin-bottom: 30px;
          text-align: right;
        }

        .logo img {
          width: 100px;
          height: auto;
          display: inline-block;
        }

        .title {
          font-size: 18px;
          color: #333;
          margin-bottom: 5px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .subtitle {
          font-size: 14px;
          color: #999;
          font-style: italic;
          margin-bottom: 25px;
        }

        .status {
          color: #E31C23;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 5px;
          letter-spacing: 0.3px;
        }

        .status-en {
          color: #E31C23;
          font-size: 13px;
          font-style: italic;
          margin-bottom: 20px;
        }

        .guest-name {
          font-size: 24px;
          color: #333;
          margin-bottom: 30px;
          font-weight: 400;
          letter-spacing: 0.5px;
        }

        .info-text {
          font-size: 13px;
          color: #666;
          line-height: 1.6;
          margin-bottom: 10px;
        }

        .info-text-en {
          font-size: 13px;
          color: #999;
          line-height: 1.6;
          font-style: italic;
        }

        .access-section {
          margin-top: 35px;
          padding-top: 25px;
          border-top: 1px solid #eee;
        }

        .access-text {
          font-size: 14px;
          color: #333;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }

        .access-text-en {
          font-size: 13px;
          color: #666;
          font-style: italic;
          margin-bottom: 20px;
        }

        .access-btn {
          display: inline-block;
          padding: 14px 40px;
          background-color: #2C3E50;
          color: white;
          text-decoration: none;
          border: none;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          letter-spacing: 0.5px;
          text-align: center;
          line-height: 1.4;
        }

        .access-btn:hover {
          background-color: #1a252f;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(44, 62, 80, 0.3);
        }

        .access-btn:active {
          transform: translateY(-1px);
        }

        .footer-bar {
          height: 8px;
          background-color: #E31C23;
          width: 100%;
        }

        @media (max-width: 600px) {
          .content {
            padding: 40px 25px;
          }

          .title {
            font-size: 16px;
          }

          .guest-name {
            font-size: 20px;
          }

          .info-text,
          .info-text-en {
            font-size: 12px;
          }

          .access-text {
            font-size: 13px;
          }

          .access-text-en {
            font-size: 12px;
          }

          .access-btn {
            padding: 12px 30px;
            font-size: 14px;
          }
        }
      `}</style>

      <div className="container">
        <div className="header-bar"></div>

        <div className="content">
          <div className="logo">
            <img src="/images/equinor-logo.png" alt="Equinor Logo" />
          </div>

          <div className="title">Celebração do 1º Óleo de Bacalhau</div>
          <div className="subtitle">Bacalhau Fist Oil Celebration</div>

          <div className="status">Presença confirmada</div>
          <div className="status-en">Attendance confirmed</div>

          <div className="guest-name">{guestName}</div>

          <div className="info-text">
            O convite com o seu QR Code será enviado para o e-mail cadastrado.
          </div>
          <div className="info-text-en">
            The invitation with your QR Code will be sent to the registered email address.
          </div>

          <div className="access-section">
            <div className="access-text">Para acessar o seu convite,</div>
            <div className="access-text-en">To access your invitation</div>
            <button onClick={handleAccessInvite} className="access-btn">
              Clique aqui<br />Click here
            </button>
          </div>
        </div>

        <div className="footer-bar"></div>
      </div>
    </>
  )
}

export default function ConfirmRioPage() {
  return (
    <Suspense fallback={
      <>
        <style jsx global>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
            color: #333;
          }
        `}</style>
        <div style={{ textAlign: 'center' }}>
          <p>Carregando...</p>
        </div>
      </>
    }>
      <ConfirmRioContent />
    </Suspense>
  )
}
