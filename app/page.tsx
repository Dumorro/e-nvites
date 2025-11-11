'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface Guest {
  id: number
  guid: string
  name: string
  email: string | null
  phone: string | null
  social_event: string | null
  status: 'pending' | 'confirmed' | 'declined'
  created_at: string
  updated_at: string
}

export default function RSVPPage() {
  const searchParams = useSearchParams()
  const guid = searchParams.get('guid')

  const [guest, setGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const formatPhone = (phone: string | null) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
    }
    return phone
  }

  useEffect(() => {
    if (!guid) {
      setError('Link inválido. Por favor, verifique o link recebido no seu convite.')
      setLoading(false)
      return
    }

    fetchGuest()
  }, [guid])

  const fetchGuest = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/rsvp?guid=${guid}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError('Convite não encontrado. Por favor, verifique o link recebido.')
        } else {
          setError('Erro ao carregar o convite. Por favor, tente novamente.')
        }
        return
      }

      setGuest(data.guest)
    } catch (err) {
      console.error('Error fetching guest:', err)
      setError('Erro ao conectar com o servidor. Por favor, tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleRSVP = async (status: 'confirmed' | 'declined') => {
    if (!guid) return

    try {
      setSubmitting(true)
      setSuccessMessage(null)

      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guid, status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar resposta')
      }

      setSuccessMessage(data.message)
      setGuest(data.guest)
    } catch (err) {
      console.error('Error updating RSVP:', err)
      alert('Erro ao processar sua resposta. Por favor, tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-equinor-bg">
        <div className="card max-w-md w-full mx-4 text-center">
          <div className="animate-spin h-12 w-12 border-b-4 border-equinor-red mx-auto"></div>
          <p className="mt-4 text-equinor-navy font-semibold">Carregando convite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-equinor-bg p-4">
        <div className="card max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-equinor-navy mb-4">Ops!</h1>
            <p className="text-equinor-navy mb-6">{error}</p>
            <p className="text-sm text-gray-600">
              Se você acredita que isso é um erro, entre em contato com o organizador do evento.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!guest) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-equinor-bg p-5 relative overflow-hidden">
      {/* Background Pattern - Mantido conforme solicitado */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-equinor-cyan rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-equinor-orange rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-equinor-pink rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <div className="card max-w-5xl w-full relative z-10">
        <div className="w-full relative rounded bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 p-1">
          <div className="bg-white p-8 rounded">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-3 bg-equinor-red/10 border-l-4 border-equinor-red rounded">
                <p className="text-equinor-red font-semibold text-sm">
                  ✓ {successMessage}
                </p>
              </div>
            )}

            <div className="text-center mb-6">
              <div className="mb-6">
                <Image
                  src="/images/equinor-logo.png"
                  alt="Equinor"
                  width={180}
                  height={70}
                  className="mx-auto"
                  priority
                />
              </div>
              <h1 className="text-2xl font-bold text-equinor-navy mb-3">
                Você foi convidado!
              </h1>
              {guest.social_event && (
                <h2 className="text-xl text-equinor-red font-bold mb-4">
                  {guest.social_event}
                </h2>
              )}
            </div>

            {/* Guest Info */}
            <div className="mb-6 pb-6 border-b">
              <h3 className="text-lg font-bold text-equinor-red mb-3 text-center">
                {guest.name}
              </h3>

              {(guest.email || guest.phone) && (
                <div className="space-y-2 text-sm text-equinor-navy max-w-md mx-auto">
                  {guest.email && (
                    <p className="flex items-center gap-2 justify-center">
                      <span>📧</span>
                      <span>{guest.email}</span>
                    </p>
                  )}
                  {guest.phone && (
                    <p className="flex items-center gap-2 justify-center">
                      <span>📱</span>
                      <span>{formatPhone(guest.phone)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="mb-6 text-center">
              <p className="text-xs text-gray-500 mb-2">Status:</p>
              {guest.status === 'confirmed' && (
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                  ✓ Confirmado
                </span>
              )}
              {guest.status === 'declined' && (
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">
                  ✗ Recusado
                </span>
              )}
              {guest.status === 'pending' && (
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded">
                  ⏳ Pendente
                </span>
              )}
            </div>

            {/* Footer Note */}
            <div className="mt-6 p-4 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-600 mb-2">Convite Individual</p>
              <p className="text-xs text-gray-500">Apresente este convite na recepção do evento</p>
              <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                Você pode alterar sua resposta a qualquer momento.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Movidos para baixo */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-6 border-t">
          <button
            onClick={() => handleRSVP('confirmed')}
            disabled={submitting || guest.status === 'confirmed'}
            className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Processando...' : 'Confirmar Presença'}
          </button>
          <button
            onClick={() => handleRSVP('declined')}
            disabled={submitting || guest.status === 'declined'}
            className="btn btn-outline flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Processando...' : 'Recusar Presença'}
          </button>
        </div>
      </div>
    </div>
  )
}
