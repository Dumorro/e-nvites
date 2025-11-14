'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface Event {
  id: number
  name: string
  location: string | null
  event_date: string | null
  template_name: string
  welcome_message: string
  event_details: string | null
  show_qr_code: boolean
}

interface Guest {
  id: number
  guid: string
  name: string
  email: string | null
  phone: string | null
  event_id: number | null
  status: 'pending' | 'confirmed' | 'declined'
  created_at: string
  updated_at: string
  event?: Event | null
}

function RSVPContent() {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-equinor-bg">
      <div className="w-full max-w-2xl">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-500 text-white rounded-lg shadow-lg text-center animate-fade-in">
            <p className="font-semibold">✓ {successMessage}</p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-t-8 border-equinor-red">
          {/* Header with Logo and Event Info */}
          <div className="bg-equinor-navy p-8 text-center">
            <div className="bg-white rounded-lg p-4 inline-block mb-6 shadow-md">
              <Image
                src="/images/equinor-logo.png"
                alt="Equinor"
                width={180}
                height={70}
                className="mx-auto"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
              {guest.event?.welcome_message || 'A Equinor tem a honra de convidá-lo(a)'}
            </h1>
            {guest.event?.name && (
              <h2 className="text-2xl text-white font-bold mb-2 border-t-2 border-white/30 pt-4 mt-4">
                {guest.event.name}
              </h2>
            )}
            {guest.event?.location && (
              <p className="text-white/90 text-lg mt-3 font-medium">
                📍 {guest.event.location}
              </p>
            )}
            {guest.event?.event_date && (
              <p className="text-white/80 text-sm mt-2">
                📅 {new Date(guest.event.event_date).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Guest Info */}
          <div className="p-8 bg-white">
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-100">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Convidado(a)</p>
              <h3 className="text-3xl font-bold text-equinor-navy mb-4">
                {guest.name}
              </h3>

              {(guest.email || guest.phone) && (
                <div className="space-y-2 text-gray-600">
                  {guest.email && (
                    <p className="flex items-center gap-2 justify-center text-sm">
                      <span>📧</span>
                      <span>{guest.email}</span>
                    </p>
                  )}
                  {guest.phone && (
                    <p className="flex items-center gap-2 justify-center text-sm">
                      <span>📱</span>
                      <span>{formatPhone(guest.phone)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="text-center mb-6">
              {guest.status === 'confirmed' && (
                <div className="inline-block">
                  <span className="inline-block px-8 py-3 bg-green-500 text-white text-lg font-bold rounded-lg shadow-lg">
                    ✓ Presença Confirmada
                  </span>
                  <p className="text-sm text-gray-500 mt-2">Aguardamos você!</p>
                </div>
              )}
              {guest.status === 'declined' && (
                <div className="inline-block">
                  <span className="inline-block px-8 py-3 bg-gray-500 text-white text-lg font-bold rounded-lg shadow-lg">
                    Presença Recusada
                  </span>
                  <p className="text-sm text-gray-500 mt-2">Obrigado por avisar</p>
                </div>
              )}
              {guest.status === 'pending' && (
                <div className="inline-block">
                  <span className="inline-block px-8 py-3 bg-yellow-500 text-white text-lg font-bold rounded-lg shadow-lg">
                    ⏳ Aguardando Confirmação
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons - SUBSTITUINDO O ESPAÇO DO QR CODE */}
            <div className="bg-gray-50 border-4 border-equinor-navy/20 rounded-xl p-8 mb-6 shadow-inner">
              <p className="text-center text-equinor-navy mb-6 font-bold text-lg uppercase tracking-wide">
                Confirme sua Presença
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleRSVP('confirmed')}
                  disabled={submitting || guest.status === 'confirmed'}
                  className="py-5 px-8 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-xl shadow-xl transition-all duration-200 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-4 border-green-700"
                >
                  {submitting ? (
                    <span>⏳ Processando...</span>
                  ) : (
                    <>
                      <span className="block text-2xl mb-1">✓</span>
                      <span>Confirmar Presença</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleRSVP('declined')}
                  disabled={submitting || guest.status === 'declined'}
                  className="py-5 px-8 bg-gray-600 hover:bg-gray-700 text-white text-lg font-bold rounded-xl shadow-xl transition-all duration-200 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-4 border-gray-700"
                >
                  {submitting ? (
                    <span>⏳ Processando...</span>
                  ) : (
                    <>
                      <span className="block text-2xl mb-1">✗</span>
                      <span>Não Poderei Ir</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center text-sm text-gray-600 space-y-3 bg-gray-50 p-6 rounded-lg">
              <p className="font-semibold text-equinor-navy">Este convite é pessoal e intransferível</p>
              <p className="text-xs">Favor apresentar este convite na recepção do evento</p>
              <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-200 italic">
                Você pode alterar sua resposta a qualquer momento acessando este link novamente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RSVPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-equinor-bg">
        <div className="card max-w-md w-full mx-4 text-center">
          <div className="animate-spin h-12 w-12 border-b-4 border-equinor-red mx-auto"></div>
          <p className="mt-4 text-equinor-navy font-semibold">Carregando convite...</p>
        </div>
      </div>
    }>
      <RSVPContent />
    </Suspense>
  )
}
