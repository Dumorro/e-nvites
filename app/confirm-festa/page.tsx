'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ConfirmFestaContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [guestName, setGuestName] = useState<string | null>(null)
  const [guestGuid, setGuestGuid] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const guidParam = searchParams.get('guid')
    console.log('[Confirm Festa] GUID from URL:', guidParam)
    if (guidParam) {
      fetchGuestData(guidParam)
    }
  }, [searchParams])

  const fetchGuestData = async (guid: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log('[Confirm Festa] Fetching guest data for GUID:', guid)
      const response = await fetch(`/api/rsvp/guest?guid=${guid}`)
      const data = await response.json()

      console.log('[Confirm Festa] API response:', { status: response.status, data })

      if (!response.ok) {
        console.error('[Confirm Festa] API error:', data.error)
        setError(data.error || 'Erro ao buscar dados do convidado')
        return
      }

      console.log('[Confirm Festa] Guest data received:', data.guest)

      // Validate that guest belongs to event 3 (Festa de Fim de Ano)
      if (data.guest.event_id !== 3) {
        setError('Este convidado não está registrado para o evento Festa de Final de Ano')
        return
      }

      setSuccess(true)
      setGuestName(data.guest.name)
      setGuestGuid(guid)
      setQrCode(data.guest.qr_code)
    } catch (err) {
      console.error('[Confirm Festa] Error:', err)
      setError('Erro ao conectar com o servidor. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccessInvite = () => {
    if (!guestGuid) {
      setError('GUID não disponível. Por favor, entre em contato com o suporte.')
      return
    }

    // Redirecionar para página de convite (pode ser implementada posteriormente)
    window.location.href = `/invite-festa?guid=${guestGuid}`
  }

  if (loading) {
    return (
      <>
        <style jsx global>{`
          body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
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
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
            color: #333;
          }
        `}</style>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', maxWidth: '500px' }}>
          <h2 style={{ color: '#e63946', marginBottom: '20px' }}>Erro</h2>
          <p style={{ marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 30px',
              backgroundColor: '#e63946',
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
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
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
          <p>Por favor, use o link de confirmação enviado para você.</p>
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
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f0f0f0;
          padding: 20px;
        }

        .container {
          position: relative;
          width: 100%;
          max-width: 500px;
        }

        /* Moldura usando as imagens */
        .frame {
          position: relative;
          background: white;
          padding: 40px;
        }

        .frame::before,
        .frame::after {
          content: '';
          position: absolute;
          background-size: contain;
          background-repeat: repeat;
        }

        /* Bordas horizontais */
        .border-top,
        .border-bottom {
          position: absolute;
          left: 0;
          right: 0;
          height: 30px;
          background-repeat: repeat-x;
          background-size: auto 100%;
        }

        .border-top {
          top: 0;
          background-image: url('/templates/festa-fim-ano/top.png');
        }

        .border-bottom {
          bottom: 0;
          background-image: url('/templates/festa-fim-ano/botton.png');
        }

        /* Bordas verticais */
        .border-left,
        .border-right {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 30px;
          background-repeat: repeat-y;
          background-size: 100% auto;
        }

        .border-left {
          left: 0;
          background-image: url('/templates/festa-fim-ano/left.png');
        }

        .border-right {
          right: 0;
          background-image: url('/templates/festa-fim-ano/rigth.png');
        }

        /* Conteúdo interno */
        .content {
          position: relative;
          z-index: 1;
          background: white;
          padding: 20px;
        }

        .logo {
          text-align: right;
          margin-bottom: 20px;
          width: 100%;
          display: block;
        }

        .logo img {
          height: 80px;
          display: inline-block;
        }

        .text-center {
          text-align: center;
        }

        h1 {
          color: #1a3a52;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
          text-align: center;
          line-height: 1.2;
        }

        .subtitle {
          color: #1a3a52;
          font-size: 20px;
          font-style: italic;
          margin-bottom: 30px;
          text-align: center;
        }

        .confirmation-title {
          color: #e63946;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .confirmation-subtitle {
          color: #e63946;
          font-size: 18px;
          font-style: italic;
          margin-bottom: 30px;
        }

        .guest-name {
          color: #1a3a52;
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 30px;
        }

        .access-text {
          color: #555;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .access-subtitle {
          color: #555;
          font-size: 14px;
          font-style: italic;
          margin-bottom: 30px;
        }

        .click-button {
          display: inline-block;
          background-color: #1a3a52;
          color: white;
          padding: 20px 60px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s, transform 0.1s;
          box-shadow: 0 4px 15px rgba(26, 58, 82, 0.3);
          border: none;
        }

        .click-button:hover {
          background-color: #0f2537;
          transform: translateY(-2px);
        }

        .click-button:active {
          transform: translateY(0);
        }

        .click-text {
          display: block;
        }

        .click-text-en {
          display: block;
          font-style: italic;
          font-size: 24px;
        }

        @media (max-width: 600px) {
          .frame {
            padding: 30px 20px;
          }

          .border-top,
          .border-bottom {
            height: 20px;
          }

          .border-left,
          .border-right {
            width: 20px;
          }

          h1 {
            font-size: 22px;
          }

          .subtitle {
            font-size: 16px;
          }

          .confirmation-title {
            font-size: 20px;
          }

          .confirmation-subtitle {
            font-size: 16px;
          }

          .guest-name {
            font-size: 24px;
          }

          .click-button {
            padding: 15px 40px;
            font-size: 22px;
          }

          .click-text-en {
            font-size: 20px;
          }
        }
      `}</style>

      <div className="container">
        <div className="frame">
          {/* Bordas da moldura */}
          <div className="border-top"></div>
          <div className="border-bottom"></div>
          <div className="border-left"></div>
          <div className="border-right"></div>

          {/* Conteúdo */}
          <div className="content">
            <div className="logo">
              <img src="/images/equinor-logo.png" alt="Logo" />
            </div>

            <div className="text-center">
              <h1>Festa de Final de Ano</h1>
              <div className="subtitle">End-of-year party</div>

              <div className="confirmation-title">Presença confirmada</div>
              <div className="confirmation-subtitle">Attendance confirmed</div>

              <div className="guest-name">{guestName}</div>

              <p className="access-text">Para acessar o seu convite</p>
              <p className="access-subtitle">To access your invitation</p>

              <button onClick={handleAccessInvite} className="click-button">
                <span className="click-text">Clique</span>
                <span className="click-text-en">click</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function ConfirmFestaPage() {
  return (
    <Suspense fallback={
      <>
        <style jsx global>{`
          body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
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
      <ConfirmFestaContent />
    </Suspense>
  )
}
