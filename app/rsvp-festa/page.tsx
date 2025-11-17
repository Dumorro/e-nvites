'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function RSVPFestaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [guestName, setGuestName] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
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
          email: email.trim().toLowerCase(),
          eventId: 7 // ID do evento festa de fim de ano
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao confirmar presença')
        return
      }

      // Redirecionar para página de confirmação com guid
      window.location.href = `/confirm-festa?guid=${data.guestGuid}`
    } catch (err) {
      console.error('Error:', err)
      setError('Erro ao conectar com o servidor. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
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
          color: #e63946;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
          text-align: center;
        }

        .subtitle {
          color: #666;
          font-size: 14px;
          font-style: italic;
          margin-bottom: 20px;
          text-align: center;
        }

        .intro-text {
          color: #333;
          font-size: 13px;
          margin-bottom: 20px;
          text-align: center;
          line-height: 1.6;
        }

        .form-group {
          margin-bottom: 15px;
        }

        label {
          display: block;
          color: #333;
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        input[type="email"] {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: Arial, sans-serif;
        }

        input:focus {
          outline: none;
          border-color: #e63946;
        }

        .submit-button {
          width: 100%;
          padding: 12px;
          background-color: #e63946;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
          transition: background-color 0.3s;
        }

        .submit-button:hover {
          background-color: #d62828;
        }

        .submit-button:active {
          transform: scale(0.98);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .event-info {
          background-color: #f8f8f8;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 12px;
          color: #555;
          line-height: 1.5;
        }

        .event-info strong {
          color: #333;
        }

        .error-message {
          background-color: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 14px;
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
            font-size: 16px;
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

              <div className="intro-text">
                Prepare-se, a festa está chegando!<br />
                <em>Get ready—the celebration is about to begin!</em>
              </div>

              <div className="event-info">
                <strong>Data/Date:</strong> 02/12<br />
                <strong>Horário/Time:</strong> 19H/ 7 PM<br />
                <strong>Local/Venue:</strong> Marina da Gloria - Av. Infante Dom Henrique s/n<br />
                Gloria – Rio de Janeiro
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">E-mail</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Processando... / Processing...' : 'Confirme / Confirm'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
