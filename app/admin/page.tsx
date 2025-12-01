'use client'

import { useEffect, useState } from 'react'

interface Event {
 id: number
 name: string
 slug: string
 template_name: string
 event_date: string | null
 location: string | null
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
 qr_code: string | null
 event?: Event | null
 emailSent?: boolean
 emailStatus?: 'sent' | 'failed' | 'pending' | null
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
 const [exporting, setExporting] = useState(false)
 const [statusFilter, setStatusFilter] = useState<string>('all')
 const [eventIdFilter, setEventIdFilter] = useState<string>('all')
 const [searchQuery, setSearchQuery] = useState('')
 const [error, setError] = useState<string | null>(null)
 const [availableEvents, setAvailableEvents] = useState<Event[]>([])
 const [currentPage, setCurrentPage] = useState(1)
 const [itemsPerPage, setItemsPerPage] = useState(20)
 const [sendingEmail, setSendingEmail] = useState<number | null>(null)
 const [totalCount, setTotalCount] = useState(0) // Total count matching all filters
 const [sortField, setSortField] = useState<'qr_code' | 'name' | null>(null)
 const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

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
   setCurrentPage(1) // Reset to first page when filters change
   fetchGuests()
  }
 }, [statusFilter, eventIdFilter, searchQuery, authenticated])

 // Sort guests
 const sortedGuests = [...guests].sort((a, b) => {
  if (!sortField) return 0

  let aValue = sortField === 'qr_code' ? (a.qr_code || '') : a.name
  let bValue = sortField === 'qr_code' ? (b.qr_code || '') : b.name

  // Convert to lowercase for case-insensitive sorting
  aValue = aValue.toLowerCase()
  bValue = bValue.toLowerCase()

  if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
  if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
  return 0
 })

 // Calculate pagination
 const totalPages = Math.ceil(totalCount / itemsPerPage)
 const startIndex = (currentPage - 1) * itemsPerPage
 const endIndex = startIndex + itemsPerPage
 const paginatedGuests = sortedGuests.slice(startIndex, endIndex)

 const handlePageChange = (page: number) => {
  setCurrentPage(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
 }

 const handleItemsPerPageChange = (value: number) => {
  setItemsPerPage(value)
  setCurrentPage(1) // Reset to first page
 }

 const handleSort = (field: 'qr_code' | 'name') => {
  if (sortField === field) {
   // Toggle direction if clicking the same field
   setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  } else {
   // Set new field and default to ascending
   setSortField(field)
   setSortDirection('asc')
  }
  setCurrentPage(1) // Reset to first page when sorting changes
 }

 const fetchGuests = async () => {
  try {
   setLoading(true)
   setError(null)

   const params = new URLSearchParams()
   if (statusFilter !== 'all') {
    params.append('status', statusFilter)
   }
   if (eventIdFilter !== 'all') {
    params.append('event_id', eventIdFilter)
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
    const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Erro ao carregar convidados'
    console.error('API Error:', data)
    throw new Error(errorMsg)
   }

   setGuests(data.guests)
   setStats(data.stats)
   setTotalCount(data.totalCount || data.guests.length) // Use totalCount from API or fallback to guests length
   if (data.events) {
    setAvailableEvents(data.events)
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

 const handleDownloadInvite = async (guest: Guest) => {
  if (!guest.qr_code) {
   alert('Este convidado não possui código QR')
   return
  }

  const eventId = guest.event_id
  if (!eventId) {
   alert('Este convidado não está associado a um evento')
   return
  }

  try {
   // Event 7 uses API to fetch from database, events 1 and 2 use direct file download
   if (eventId === 7) {
    // Fetch from API (database or filesystem)
    const response = await fetch(`/api/rsvp/guest-image?qrCode=${guest.qr_code}&eventId=${eventId}`)
    const data = await response.json()

    if (!response.ok || !data.success) {
     alert(data.error || 'Convite não encontrado')
     return
    }

    // Extract mime type and determine extension
    const matches = data.imageData.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
     alert('Formato de imagem inválido')
     return
    }

    const mimeType = matches[1]
    const extension = mimeType === 'image/png' ? 'png' : 'jpg'

    // Download the file using the base64 data URI
    const link = document.createElement('a')
    link.href = data.imageData
    link.download = `convite-${guest.qr_code}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
   } else if (eventId === 1 || eventId === 2) {
    // Direct download from public folder
    const eventSlug = eventId === 1 ? 'oil-celebration-rj' : 'oil-celebration-sp'
    const imageUrl = `/events/${eventSlug}/${guest.qr_code}-${eventSlug}.jpg`

    // Check if file exists first
    const checkResponse = await fetch(imageUrl, { method: 'HEAD' })
    if (!checkResponse.ok) {
     alert('Convite não encontrado')
     return
    }

    // Download the file
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `convite-${guest.qr_code}.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
   } else {
    alert('Evento não suportado para download de convite')
   }
  } catch (err: any) {
   console.error('Error downloading invite:', err)
   alert(`Erro ao baixar convite: ${err.message}`)
  }
 }

 const handleResendEmail = async (guestId: number, guestEmail: string) => {
  if (!guestEmail) {
   alert('Este convidado não tem email cadastrado')
   return
  }

  if (!confirm(`Deseja reenviar o email de confirmação para ${guestEmail}?`)) {
   return
  }

  setSendingEmail(guestId)

  try {
   const response = await fetch('/api/email/send-confirmation', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
     'x-admin-password': password,
    },
    body: JSON.stringify({ guestId }),
   })

   const data = await response.json()

   if (!response.ok) {
    throw new Error(data.error || 'Erro ao enviar email')
   }

   alert(`Email enviado com sucesso para ${guestEmail}!`)
   fetchGuests() // Refresh the list
  } catch (err: any) {
   console.error('Error sending email:', err)
   alert(`Erro ao enviar email: ${err.message}`)
  } finally {
   setSendingEmail(null)
  }
 }

 const exportToCSV = async () => {
  try {
   setExporting(true)

   // Fetch ALL guests matching filters (no limit) for export
   const params = new URLSearchParams()
   params.append('export', 'true') // Enable export mode (removes limit)

   if (statusFilter !== 'all') {
    params.append('status', statusFilter)
   }
   if (eventIdFilter !== 'all') {
    params.append('event_id', eventIdFilter)
   }
   if (searchQuery) {
    params.append('search', searchQuery)
   }

   console.log('📥 [Export] Fetching all guests for CSV export...')
   const response = await fetch(`/api/rsvp/list?${params}`, {
    headers: {
     'x-admin-password': password,
    },
   })

   if (!response.ok) {
    throw new Error('Erro ao buscar dados para exportação')
   }

   const data = await response.json()
   const allGuests = data.guests
   console.log(`📥 [Export] Fetched ${allGuests.length} guests for export`)

   // Create CSV content from ALL filtered guests
   const headers = ['QR Code', 'Nome', 'Email', 'Telefone', 'Evento', 'Local', 'Status', 'Data Criação', 'Última Atualização']
   const csvRows = [headers.join(',')]

   allGuests.forEach((guest: Guest) => {
    const eventName = guest.event?.name || ''
    const eventLocation = guest.event?.location || ''

    const row = [
     `"${guest.qr_code || ''}"`,
     `"${guest.name}"`,
     `"${guest.email || ''}"`,
     `"${formatPhone(guest.phone)}"`,
     `"${eventName}"`,
     `"${eventLocation}"`,
     guest.status === 'confirmed' ? 'Confirmado' : guest.status === 'declined' ? 'Recusado' : 'Pendente',
     `"${formatDate(guest.created_at)}"`,
     `"${formatDate(guest.updated_at)}"`
    ]
    csvRows.push(row.join(','))
   })

   const csvContent = csvRows.join('\n')
   const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
   const link = document.createElement('a')
   const url = URL.createObjectURL(blob)

   // Generate filename with current date and filters
   const date = new Date().toISOString().split('T')[0]
   let filename = `convidados_${date}`
   if (statusFilter !== 'all') filename += `_${statusFilter}`
   if (eventIdFilter !== 'all') {
    const selectedEvent = availableEvents.find(e => e.id.toString() === eventIdFilter)
    if (selectedEvent) {
     filename += `_${selectedEvent.slug}`
    }
   }
   if (searchQuery) filename += `_busca`
   filename += '.csv'

   link.setAttribute('href', url)
   link.setAttribute('download', filename)
   link.style.visibility = 'hidden'
   document.body.appendChild(link)
   link.click()
   document.body.removeChild(link)

   console.log(`✅ [Export] CSV generated successfully: ${filename}`)
  } catch (error) {
   console.error('❌ [Export] Error:', error)
   alert('Erro ao exportar CSV. Por favor, tente novamente.')
  } finally {
   setExporting(false)
  }
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

    {/* Stats Cards and Action Buttons */}
    {stats && (
     <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
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

      <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-green-500">
       <div className="flex items-center justify-between">
        <div>
         <p className="text-sm text-gray-600 mb-1">Confirmados</p>
         <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
        </div>
        <div className="w-12 h-12 bg-green-500 flex items-center justify-center rounded-md">
         <span className="text-2xl text-white">✓</span>
        </div>
       </div>
      </div>

      <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-yellow-400">
       <div className="flex items-center justify-between">
        <div>
         <p className="text-sm text-gray-600 mb-1">Pendentes</p>
         <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="w-12 h-12 bg-yellow-400 flex items-center justify-center rounded-md">
         <span className="text-2xl">⏳</span>
        </div>
       </div>
      </div>

      <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-equinor-navy">
       <div className="flex flex-row gap-3 items-center justify-center h-full">
        <a
         href="/admin/import-guests"
         className="btn bg-equinor-navy text-white hover:bg-equinor-navy/90 w-14 h-14 flex items-center justify-center rounded-lg text-2xl relative group"
         title="Importar Convidados"
        >
         📄
         <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          Importar Convidados
         </span>
        </a>
        <a
         href="/admin/upload-invites"
         className="btn bg-equinor-navy text-white hover:bg-equinor-navy/90 w-14 h-14 flex items-center justify-center rounded-lg text-2xl relative group"
         title="Upload de Convites"
        >
         📦
         <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          Upload de Convites
         </span>
        </a>
        <a
         href="/admin/import-logs"
         className="btn bg-equinor-navy text-white hover:bg-equinor-navy/90 w-14 h-14 flex items-center justify-center rounded-lg text-2xl relative group"
         title="Histórico de Importações"
        >
         📋
         <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          Histórico de Importações
         </span>
        </a>
       </div>
      </div>
     </div>
    )}

    {/* Filters */}
    <div className="bg-white rounded-md shadow-sm p-6 mb-6">
     <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="flex-1">
       <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
        Buscar por nome ou email
       </label>
       <input
        type="text"
        id="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Digite o nome ou email do convidado..."
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
        <option value="pending">Pendentes</option>
       </select>
      </div>
      <div className="sm:w-64">
       <label htmlFor="eventFilter" className="block text-sm font-medium text-gray-700 mb-2">
        Filtrar por evento
       </label>
       <select
        id="eventFilter"
        value={eventIdFilter}
        onChange={(e) => setEventIdFilter(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
       >
        <option value="all">Todos os eventos</option>
        {availableEvents.map((event) => (
         <option key={event.id} value={event.id.toString()}>
          {event.name} - {event.location}
         </option>
        ))}
       </select>
      </div>
     </div>

     {/* Export Button and Items Per Page */}
     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200">
      <div className="flex items-center gap-4">
       <p className="text-sm text-gray-600">
        {totalCount} {totalCount === 1 ? 'convidado encontrado' : 'convidados encontrados'}
       </p>
       <div className="flex items-center gap-2">
        <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
         Mostrar:
        </label>
        <select
         id="itemsPerPage"
         value={itemsPerPage}
         onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
         className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
         <option value={20}>20</option>
         <option value={50}>50</option>
         <option value={100}>100</option>
        </select>
        <span className="text-sm text-gray-600">por página</span>
       </div>
      </div>
      <button
       onClick={exportToCSV}
       disabled={guests.length === 0 || exporting}
       className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
       {exporting ? (
        <>
         <span className="animate-spin">⏳</span>
         <span>Exportando...</span>
        </>
       ) : (
        <>
         <span>📥</span>
         <span>Exportar CSV</span>
        </>
       )}
      </button>
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
          <th
           className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none transition-colors"
           onClick={() => handleSort('qr_code')}
           title="Clique para ordenar por QR Code"
          >
           <div className="flex items-center gap-2">
            <span>QR Code</span>
            {sortField === 'qr_code' ? (
             <span className="text-equinor-navy font-bold text-base">
              {sortDirection === 'asc' ? '↑' : '↓'}
             </span>
            ) : (
             <span className="text-gray-400 text-xs">⇅</span>
            )}
           </div>
          </th>
          <th
           className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none transition-colors"
           onClick={() => handleSort('name')}
           title="Clique para ordenar por Nome"
          >
           <div className="flex items-center gap-2">
            <span>Nome</span>
            {sortField === 'name' ? (
             <span className="text-equinor-navy font-bold text-base">
              {sortDirection === 'asc' ? '↑' : '↓'}
             </span>
            ) : (
             <span className="text-gray-400 text-xs">⇅</span>
            )}
           </div>
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
         {paginatedGuests.map((guest) => (
          <tr key={guest.id} className="hover:bg-gray-50">
           <td className="px-6 py-4">
            <div className="text-xs text-gray-900 max-w-xs overflow-hidden text-ellipsis">
             {guest.qr_code || '-'}
            </div>
           </td>
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
             {guest.event?.name || '-'}
            </div>
            {guest.event?.location && (
             <div className="text-xs text-gray-500">{guest.event.location}</div>
            )}
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
           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            <div className="flex flex-col gap-2">
             {/* Download Invite Button */}
             {guest.qr_code && guest.event_id && [1, 2, 7].includes(guest.event_id) && (
              <button
               onClick={() => handleDownloadInvite(guest)}
               className="text-green-600 hover:text-green-800 flex items-center gap-1 text-xs"
               title="Baixar convite"
              >
               <span>📥</span>
               <span>Baixar Convite</span>
              </button>
             )}

             {/* Resend Email Button */}
             {guest.status === 'confirmed' && guest.email && (
              <button
               onClick={() => handleResendEmail(guest.id, guest.email!)}
               disabled={sendingEmail === guest.id}
               className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
               title="Reenviar email de confirmação"
              >
               {sendingEmail === guest.id ? (
                <>
                 <span className="animate-spin">⏳</span>
                 <span>Enviando...</span>
                </>
               ) : (
                <>
                 <span>📧</span>
                 <span>Reenviar Email</span>
                </>
               )}
              </button>
             )}

             {guest.status === 'confirmed' && !guest.email && (
              <span className="text-gray-400 text-xs">Sem email</span>
             )}
             {guest.status !== 'confirmed' && (
              <span className="text-gray-400 text-xs">Não confirmado</span>
             )}
            </div>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     )}

     {/* Pagination Controls */}
     {!loading && !error && guests.length > 0 && totalPages > 1 && (
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-600">
         Mostrando {startIndex + 1} a {Math.min(endIndex, sortedGuests.length)} de {sortedGuests.length} registros
        </div>
        <div className="flex items-center gap-2">
         <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
         >
          ← Anterior
         </button>

         <div className="flex items-center gap-1">
          {/* First page */}
          {currentPage > 3 && (
           <>
            <button
             onClick={() => handlePageChange(1)}
             className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
             1
            </button>
            {currentPage > 4 && (
             <span className="px-2 text-gray-500">...</span>
            )}
           </>
          )}

          {/* Page numbers around current page */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
           .filter(page => {
            return page === currentPage ||
                   page === currentPage - 1 ||
                   page === currentPage + 1 ||
                   page === currentPage - 2 ||
                   page === currentPage + 2
           })
           .map(page => (
            <button
             key={page}
             onClick={() => handlePageChange(page)}
             className={`px-3 py-2 border rounded-md text-sm font-medium ${
              page === currentPage
               ? 'bg-equinor-navy text-white border-equinor-navy'
               : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
             }`}
            >
             {page}
            </button>
           ))}

          {/* Last page */}
          {currentPage < totalPages - 2 && (
           <>
            {currentPage < totalPages - 3 && (
             <span className="px-2 text-gray-500">...</span>
            )}
            <button
             onClick={() => handlePageChange(totalPages)}
             className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
             {totalPages}
            </button>
           </>
          )}
         </div>

         <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
         >
          Próxima →
         </button>
        </div>
       </div>
      </div>
     )}
    </div>
   </div>
  </div>
 )
}
