'use client'

import { useEffect, useState } from 'react'

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

interface Stats {
 total: number
 confirmed: number
 declined: number
 pending: number
}

export default function AdminPage() {
 const [authenticated, setAuthenticated] = useState(false)
 const [password, setPassword] = useState('')
 const [guests, setGuests] = useState<Guest[]>([])
 const [stats, setStats] = useState<Stats | null>(null)
 const [loading, setLoading] = useState(false)
 const [statusFilter, setStatusFilter] = useState<string>('all')
 const [socialEventFilter, setSocialEventFilter] = useState<string>('all')
 const [searchQuery, setSearchQuery] = useState('')
 const [error, setError] = useState<string | null>(null)
 const [availableSocialEvents, setAvailableSocialEvents] = useState<string[]>([])

 const handleLogin = (e: React.FormEvent) => {
  e.preventDefault()
  if (password) {
   sessionStorage.setItem('adminPassword', password)
   setAuthenticated(true)
   fetchGuests()
  }
 }

 useEffect(() => {
  const savedPassword = sessionStorage.getItem('adminPassword')
  if (savedPassword) {
   setPassword(savedPassword)
   setAuthenticated(true)
   fetchGuests()
  }
 }, [])

 useEffect(() => {
  if (authenticated) {
   fetchGuests()
  }
 }, [statusFilter, socialEventFilter, searchQuery, authenticated])

 const fetchGuests = async () => {
  try {
   setLoading(true)
   setError(null)

   const params = new URLSearchParams()
   if (statusFilter !== 'all') {
    params.append('status', statusFilter)
   }
   if (socialEventFilter !== 'all') {
    params.append('social_event', socialEventFilter)
   }
   if (searchQuery) {
    params.append('search', searchQuery)
   }

   const response = await fetch(`/api/rsvp/list?${params}`, {
    headers: {
     'x-admin-password': password,
    },
   })

   if (response.status === 401) {
    setAuthenticated(false)
    sessionStorage.removeItem('adminPassword')
    setError('Senha incorreta. Por favor, faça login novamente.')
    return
   }

   const data = await response.json()

   if (!response.ok) {
    throw new Error(data.error || 'Erro ao carregar convidados')
   }

   setGuests(data.guests)
   setStats(data.stats)
   if (data.socialEvents) {
    setAvailableSocialEvents(data.socialEvents)
   }
  } catch (err) {
   console.error('Error fetching guests:', err)
   setError('Erro ao carregar convidados. Por favor, tente novamente.')
  } finally {
   setLoading(false)
  }
 }

 const handleLogout = () => {
  setAuthenticated(false)
  setPassword('')
  sessionStorage.removeItem('adminPassword')
 }

 const copyInviteLink = (guid: string) => {
  const url = `${window.location.origin}/?guid=${guid}`
  navigator.clipboard.writeText(url)
  alert('Link copiado para a área de transferência!')
 }

 const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
   day: '2-digit',
   month: '2-digit',
   year: 'numeric',
   hour: '2-digit',
   minute: '2-digit',
  })
 }

 const formatPhone = (phone: string | null) => {
  if (!phone) return '-'
  // Format: 5531999887766 -> +55 (31) 99988-7766
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 13) {
   return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
  }
  return phone
 }

 // Login Screen
 if (!authenticated) {
  return (
   <div className="min-h-screen flex items-center justify-center bg-equinor-bg p-4">
    <div className="card max-w-md w-full">
     <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-equinor-red mb-4">
       <span className="text-2xl text-white">🔐</span>
      </div>
      <h1 className="text-3xl font-bold text-equinor-navy mb-2">
       Área Administrativa
      </h1>
      <p className="text-gray-600">
       Digite a senha para acessar o painel
      </p>
     </div>

     {error && (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 ">
       <p className="text-red-800 text-sm">{error}</p>
      </div>
     )}

     <form onSubmit={handleLogin}>
      <div className="mb-6">
       <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
        Senha
       </label>
       <input
        type="password"
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Digite a senha"
        required
       />
      </div>
      <button type="submit" className="btn btn-primary w-full">
       Entrar
      </button>
     </form>
    </div>
   </div>
  )
 }

 // Admin Dashboard
 return (
  <div className="min-h-screen bg-equinor-bg p-4 sm:p-6 lg:p-8">
   <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="bg-gradient-to-r from-equinor-red to-equinor-navy rounded-md shadow-lg p-6 mb-6">
     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
       <h1 className="text-3xl font-bold text-white mb-2">
        Painel Administrativo Equinor
       </h1>
       <p className="text-white/90">Gerenciar confirmações de presença</p>
      </div>
      <button
       onClick={handleLogout}
       className="btn bg-white text-equinor-navy hover:bg-gray-100"
      >
       Sair
      </button>
     </div>
    </div>

    {/* Stats Cards */}
    {stats && (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-equinor-navy">
       <div className="flex items-center justify-between">
        <div>
         <p className="text-sm text-gray-600 mb-1">Total</p>
         <p className="text-3xl font-bold text-equinor-navy">{stats.total}</p>
        </div>
        <div className="w-12 h-12 bg-equinor-navy/10 flex items-center justify-center">
         <span className="text-2xl">👥</span>
        </div>
       </div>
      </div>

      <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-equinor-red">
       <div className="flex items-center justify-between">
        <div>
         <p className="text-sm text-gray-600 mb-1">Confirmados</p>
         <p className="text-3xl font-bold text-equinor-red">{stats.confirmed}</p>
        </div>
        <div className="w-12 h-12 bg-equinor-red/10 flex items-center justify-center">
         <span className="text-2xl">✓</span>
        </div>
       </div>
      </div>

      <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-gray-400">
       <div className="flex items-center justify-between">
        <div>
         <p className="text-sm text-gray-600 mb-1">Recusados</p>
         <p className="text-3xl font-bold text-gray-600">{stats.declined}</p>
        </div>
        <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
         <span className="text-2xl">✗</span>
        </div>
       </div>
      </div>

      <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-equinor-blue">
       <div className="flex items-center justify-between">
        <div>
         <p className="text-sm text-gray-600 mb-1">Pendentes</p>
         <p className="text-3xl font-bold text-equinor-blue">{stats.pending}</p>
        </div>
        <div className="w-12 h-12 bg-equinor-blue/10 flex items-center justify-center">
         <span className="text-2xl">⏳</span>
        </div>
       </div>
      </div>
     </div>
    )}

    {/* Filters */}
    <div className="bg-white rounded-md shadow-sm p-6 mb-6">
     <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
       <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
        Buscar por nome
       </label>
       <input
        type="text"
        id="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Digite o nome do convidado..."
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
       />
      </div>
      <div className="sm:w-64">
       <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
        Filtrar por status
       </label>
       <select
        id="status"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
       >
        <option value="all">Todos</option>
        <option value="confirmed">Confirmados</option>
        <option value="declined">Recusados</option>
        <option value="pending">Pendentes</option>
       </select>
      </div>
      <div className="sm:w-64">
       <label htmlFor="socialEvent" className="block text-sm font-medium text-gray-700 mb-2">
        Filtrar por evento
       </label>
       <select
        id="socialEvent"
        value={socialEventFilter}
        onChange={(e) => setSocialEventFilter(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
       >
        <option value="all">Todos os eventos</option>
        {availableSocialEvents.map((event) => (
         <option key={event} value={event}>
          {event}
         </option>
        ))}
       </select>
      </div>
     </div>
    </div>

    {/* Guests Table */}
    <div className="bg-white shadow-sm overflow-hidden">
     {loading ? (
      <div className="p-12 text-center">
       <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
       <p className="text-gray-600">Carregando convidados...</p>
      </div>
     ) : error ? (
      <div className="p-12 text-center">
       <p className="text-red-600 mb-4">{error}</p>
       <button onClick={fetchGuests} className="btn btn-primary">
        Tentar Novamente
       </button>
      </div>
     ) : guests.length === 0 ? (
      <div className="p-12 text-center">
       <p className="text-gray-600 text-lg">Nenhum convidado encontrado</p>
      </div>
     ) : (
      <div className="overflow-x-auto">
       <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
         <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           Nome
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           Email
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           Telefone
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           Evento
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           Última Atualização
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
           Ações
          </th>
         </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
         {guests.map((guest) => (
          <tr key={guest.id} className="hover:bg-gray-50">
           <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">
             {guest.name}
            </div>
           </td>
           <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
             {guest.email || '-'}
            </div>
           </td>
           <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
             {formatPhone(guest.phone)}
            </div>
           </td>
           <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
             {guest.social_event || '-'}
            </div>
           </td>
           <td className="px-6 py-4 whitespace-nowrap">
            {guest.status === 'confirmed' && (
             <span className="badge badge-confirmed">Confirmado</span>
            )}
            {guest.status === 'declined' && (
             <span className="badge badge-declined">Recusado</span>
            )}
            {guest.status === 'pending' && (
             <span className="badge badge-pending">Pendente</span>
            )}
           </td>
           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {formatDate(guest.updated_at)}
           </td>
           <td className="px-6 py-4 whitespace-nowrap text-sm">
            <button
             onClick={() => copyInviteLink(guest.guid)}
             className="text-blue-600 hover:text-blue-800 font-medium"
            >
             📋 Copiar Link
            </button>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     )}
    </div>
   </div>
  </div>
 )
}
