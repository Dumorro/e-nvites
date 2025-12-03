'use client'

import { useState } from 'react'

export default function RSVPRioPage() {
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
          eventId: 1
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao confirmar presença')
        return
      }

      // Redirecionar para página de confirmação com guid
      window.location.href = `/confirm-rj?guid=${data.guestGuid}`
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            background: white;
            width: 100%;
            max-width: 500px;
            border-top: 8px solid #1a3a4a;
            border-bottom: 8px solid #1a3a4a;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            padding: 40px 30px;
            text-align: right;
            border-bottom: 1px solid #f0f0f0;
            display: flex;
            justify-content: flex-end;
        }

        .logo {
            width: 100px;
            height: auto;
        }

        .invitation-text {
            text-align: center;
            margin-bottom: 20px;
        }

        .invitation-text h2 {
            font-size: 18px;
            color: #333;
            font-weight: 400;
            margin-bottom: 15px;
            line-height: 1.6;
        }

        .invitation-text h2 strong {
            font-weight: 600;
            color: #1a3a4a;
        }

        .invitation-text p {
            font-size: 14px;
            color: #666;
            font-style: italic;
            line-height: 1.6;
        }

        .event-details {
            background: #1a3a4a;
            color: white;
            padding: 25px 30px;
            margin: 30px 0;
            font-size: 13px;
            line-height: 1.8;
        }

        .event-details p {
            margin-bottom: 10px;
        }

        .event-details strong {
            font-weight: 600;
        }

        .form-section {
            padding: 30px;
            text-align: center;
        }

        .form-group {
            margin-bottom: 25px;
            display: flex;
            align-items: center;
        }

        .form-group label {
            display: inline-block;
            font-size: 13px;
            color: #999;
            margin-right: 10px;
            text-align: left;
            font-weight: 500;
        }

        .form-group input {
            display: inline-block;
            width: auto;
            flex: 1;
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            color: #333;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus {
            outline: none;
            border-color: #e91e63;
            box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.1);
        }

        .form-group input::placeholder {
            color: #bbb;
        }

        .submit-btn {
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

        .submit-btn:hover {
            background: #0f2633;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(26, 58, 74, 0.3);
        }

        .submit-btn:active {
            transform: translateY(0);
        }

        .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
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

        .success-container {
            text-align: center;
            padding: 40px 30px;
        }

        .success-container h2 {
            color: #1a3a4a;
            font-size: 24px;
            margin-bottom: 20px;
        }

        .success-container .checkmark {
            font-size: 64px;
            color: #4caf50;
            margin-bottom: 20px;
        }

        .success-container p {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
        }

        .success-container .guest-name {
            color: #1a3a4a;
            font-weight: 600;
            font-size: 18px;
            margin: 15px 0;
        }

        @media (max-width: 600px) {
            .container {
                border-top-width: 6px;
                border-bottom-width: 6px;
            }

            .header {
                padding: 30px 20px;
            }

            .invitation-text h2 {
                font-size: 16px;
            }

            .event-details {
                padding: 20px;
                font-size: 12px;
            }

            .form-section {
                padding: 20px;
            }

            .logo {
                width: 80px;
            }
        }
      `}</style>

      <div className="container">
        {success ? (
          <>
            <div className="header">
              <img src="/images/equinor-logo.png" alt="Equinor Logo" className="logo" />
            </div>
            <div className="success-container">
              <div className="checkmark">✓</div>
              <h2>Presença Confirmada!<br />Presence Confirmed!</h2>
              <p className="guest-name">{guestName}</p>
              <p>
                Sua presença foi confirmada para a<br />
                <strong>Celebração do 1º Óleo de Bacalhau</strong>
              </p>
              <div className="event-details" style={{ marginTop: '30px' }}>
                <p><strong>Data/Date:</strong> 15 de Dezembro de 2025 | December 15, 2025</p>
                <p><strong>Horário/Time:</strong> 18h30 | 6:30 PM</p>
                <p><strong>Local/Venue:</strong> MAR | Museu de Arte do Rio, Praça Mauá, 5 | Centro, Rio de Janeiro</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="header">
              <img src="/images/equinor-logo.png" alt="Equinor Logo" className="logo" />
            </div>

            <div className="invitation-text">
              <h2>A Equinor tem a honra de convidá-lo para a<br /><strong>Celebração do 1º Óleo de Bacalhau</strong></h2>
              <hr style={{ width: '50px', margin: '15px auto', border: 0, borderTop: '3px solid #e91e63' }} />
              <h2>Equinor is pleased to invite you to the<br /><strong><em>Bacalhau Fist Oil Celebration</em></strong></h2>
            </div>

            <div className="event-details">
              <p><strong>Data/Date:</strong> 15 de Dezembro de 2025 | December 15, 2025</p>
              <p><strong>Horário/Time:</strong> 18h30 | 6:30 PM</p>
              <p><strong>Local/Venue:</strong> MAR | Museu de Arte do Rio, Praça Mauá, 5 | Centro, Rio de Janeiro</p>
            </div>

            <div className="form-section">
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
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Processando...' : 'Confirmar'}
                  <br />
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  )
}
