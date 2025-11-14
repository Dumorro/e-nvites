'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function RSVPSaoPauloPage() {
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
          eventId: 2
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #243746 0%, #1a2835 100%)'
    }}>
      <style jsx global>{`
        body {
          font-family: Arial, sans-serif;
        }
      `}</style>

      <div className="w-full max-w-2xl">
        {success ? (
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-t-8" style={{ borderColor: '#FF1243' }}>
            <div className="p-8 text-center" style={{ backgroundColor: '#243746' }}>
              <div className="bg-white rounded-lg p-4 inline-block mb-6 shadow-md">
                <Image
                  src="/images/equinor-logo2.png"
                  alt="Equinor"
                  width={180}
                  height={70}
                  className="mx-auto"
                  priority
                />
              </div>
            </div>

            <div className="p-8 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: '#243746' }}>
                Presença Confirmada!
              </h2>
              <p className="text-xl mb-2" style={{ color: '#243746' }}>
                {guestName}
              </p>
              <p className="text-gray-600 mb-6">
                Sua presença foi confirmada para a
              </p>
              <h3 className="text-2xl font-bold mb-6" style={{ color: '#FF1243' }}>
                Celebração do 1º Óleo de Bacalhau
              </h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-sm" style={{ color: '#243746' }}>
                  📍 São Paulo
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Aguardamos você!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-t-8" style={{ borderColor: '#FF1243' }}>
            <div className="p-8 text-center" style={{ backgroundColor: '#243746' }}>
              <div className="bg-white rounded-lg p-4 inline-block mb-6 shadow-md">
                <Image
                  src="/images/equinor-logo2.png"
                  alt="Equinor"
                  width={180}
                  height={70}
                  className="mx-auto"
                  priority
                />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3 leading-tight">
                A Equinor tem a honra de convidá-lo(a)
              </h1>
              <h2 className="text-2xl text-white font-bold mb-2 border-t-2 border-white/30 pt-4 mt-4">
                Celebração do 1º Óleo de Bacalhau
              </h2>
              <p className="text-white/90 text-lg mt-3 font-medium">
                📍 São Paulo
              </p>
            </div>

            <div className="p-8">
              <div className="mb-8 text-center">
                <p className="text-lg mb-2" style={{ color: '#243746' }}>
                  <em>Equinor is pleased to invite you to the</em>
                </p>
                <p className="text-lg font-bold mb-4" style={{ color: '#243746' }}>
                  <em>Bacalhau First Oil Celebration</em>
                </p>
                <p className="text-sm text-gray-600">
                  Localizado no pré-sal da Bacia de Santos, com capacidade para produzir até 220 mil barris por dia.
                </p>
              </div>

              <div className="border-4 rounded-xl p-8 mb-6 shadow-inner" style={{
                borderColor: 'rgba(36, 55, 70, 0.2)',
                backgroundColor: '#f9fafb'
              }}>
                <p className="text-center mb-6 font-bold text-lg uppercase tracking-wide" style={{ color: '#243746' }}>
                  Confirme sua Presença
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#243746' }}>
                      Email cadastrado
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: '#243746',
                        color: '#243746'
                      }}
                      placeholder="seu.email@exemplo.com"
                      disabled={loading}
                      required
                    />
                  </div>

                  {error && (
                    <div className="mb-4 p-4 bg-red-100 border-2 border-red-300 text-red-700 rounded-lg text-center">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-8 text-white text-lg font-bold rounded-xl shadow-xl transition-all duration-200 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-4"
                    style={{
                      backgroundColor: '#FF1243',
                      borderColor: '#d10e36'
                    }}
                  >
                    {loading ? (
                      <span>⏳ Processando...</span>
                    ) : (
                      <span>✓ Confirmar Presença</span>
                    )}
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
