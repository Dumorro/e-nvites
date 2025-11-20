'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ImportStats {
  totalRows: number
  inserted: number
  errors: number
  errorDetails: Array<{ row: number; error: string }>
}

export default function ImportGuestsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string>('1')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<string[][] | null>(null)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [importStats, setImportStats] = useState<ImportStats | null>(null)

  useEffect(() => {
    const password = sessionStorage.getItem('adminPassword')
    if (!password) {
      router.push('/admin')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  const events = [
    { id: '1', name: 'Rio de Janeiro (oil-celebration-rj)' },
    { id: '2', name: 'São Paulo (oil-celebration-sp)' },
    { id: '7', name: 'Festa de Fim de Ano (festa-equinor)' },
  ]

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setMessage({ type: 'error', text: 'Por favor, selecione um arquivo CSV' })
        return
      }
      setSelectedFile(file)
      setMessage(null)
      setImportStats(null)

      // Preview first 5 rows
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const preview = lines.slice(0, 6).map(line => {
        // Parse CSV properly handling quoted values
        const values: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        values.push(current.trim())
        return values
      })
      setCsvPreview(preview)
    }
  }


  const handleImport = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Selecione um arquivo CSV primeiro' })
      return
    }

    try {
      setImporting(true)
      setMessage(null)
      setImportStats(null)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('eventId', selectedEvent)

      const password = sessionStorage.getItem('adminPassword')
      const response = await fetch('/api/admin/import-guests', {
        method: 'POST',
        headers: {
          'x-admin-password': password || '',
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar convidados')
      }

      setMessage({ type: 'success', text: data.message })
      setImportStats(data.stats)
      setSelectedFile(null)
      setCsvPreview(null)

      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (error) {
      console.error('Import error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao importar convidados',
      })
    } finally {
      setImporting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Verificando autenticação...</p>
      </div>
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          padding: 40px;
        }

        .header {
          margin-bottom: 30px;
        }

        .header h1 {
          color: #2d3748;
          font-size: 28px;
          margin-bottom: 8px;
        }

        .header p {
          color: #718096;
          font-size: 14px;
          line-height: 1.6;
        }

        .back-link {
          display: inline-block;
          margin-bottom: 20px;
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          color: #2d3748;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .form-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          color: #2d3748;
          background-color: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .form-group select:focus {
          outline: none;
          border-color: #667eea;
        }

        .dropzone {
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #f7fafc;
        }

        .dropzone:hover {
          border-color: #667eea;
          background-color: #edf2f7;
        }

        .dropzone.active {
          border-color: #667eea;
          background-color: #e6fffa;
        }

        .dropzone-icon {
          font-size: 48px;
          margin-bottom: 16px;
          color: #a0aec0;
        }

        .dropzone-text {
          color: #4a5568;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .dropzone-hint {
          color: #a0aec0;
          font-size: 14px;
        }

        .csv-format {
          background-color: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }

        .csv-format h4 {
          color: #2d3748;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .csv-format code {
          display: block;
          background-color: #2d3748;
          color: #48bb78;
          padding: 12px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          overflow-x: auto;
        }

        .csv-preview {
          margin-top: 16px;
          background-color: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
        }

        .csv-preview h4 {
          color: #2d3748;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .csv-preview table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .csv-preview th {
          background-color: #667eea;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: 600;
        }

        .csv-preview td {
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
          color: #4a5568;
        }

        .csv-preview tr:last-child td {
          border-bottom: none;
        }

        .file-info {
          margin-top: 16px;
          padding: 12px;
          background-color: #edf2f7;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .file-info-text {
          color: #2d3748;
          font-size: 14px;
          font-weight: 500;
        }

        .file-info-size {
          color: #718096;
          font-size: 12px;
        }

        .remove-file {
          background: none;
          border: none;
          color: #e53e3e;
          cursor: pointer;
          font-size: 20px;
          padding: 4px;
        }

        .import-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .import-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .import-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .message.success {
          background-color: #c6f6d5;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }

        .message.error {
          background-color: #fed7d7;
          color: #742a2a;
          border: 1px solid #fc8181;
        }

        .stats {
          margin-top: 24px;
          padding: 20px;
          background-color: #f7fafc;
          border-radius: 8px;
        }

        .stats h3 {
          color: #2d3748;
          font-size: 16px;
          margin-bottom: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-item {
          text-align: center;
          padding: 12px;
          background-color: white;
          border-radius: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .error-list {
          max-height: 300px;
          overflow-y: auto;
          padding: 12px;
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .error-item {
          padding: 8px;
          font-size: 12px;
          color: #e53e3e;
          border-bottom: 1px solid #e2e8f0;
          font-family: 'Courier New', monospace;
        }

        .error-item:last-child {
          border-bottom: none;
        }

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="container">
        <a href="/admin" className="back-link">
          ← Voltar para Admin
        </a>

        <div className="card">
          <div className="header">
            <h1>Importação de Convidados</h1>
            <p>
              Faça upload de um arquivo CSV para adicionar convidados em lote ao evento selecionado.
              <br />
              Os convidados serão criados com status <strong>pending</strong> e um GUID único será gerado automaticamente.
            </p>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleImport(); }}>
            <div className="form-group">
              <label htmlFor="eventSelect">Selecione o Evento</label>
              <select
                id="eventSelect"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                disabled={importing}
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Arquivo CSV</label>
              <div
                className={`dropzone ${selectedFile ? 'active' : ''}`}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={importing}
                />
                <div className="dropzone-icon">📄</div>
                <div className="dropzone-text">
                  {selectedFile ? 'Arquivo selecionado!' : 'Clique para selecionar um arquivo CSV'}
                </div>
                <div className="dropzone-hint">
                  {selectedFile ? selectedFile.name : 'Ou arraste e solte aqui'}
                </div>
              </div>

              <div className="csv-format">
                <h4>Formato esperado do CSV:</h4>
                <code>qrcode,nome,email,celular</code>
              </div>

              {csvPreview && (
                <div className="csv-preview">
                  <h4>Prévia das primeiras linhas:</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>QR Code</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Celular</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(1).map((row, idx) => (
                        <tr key={idx}>
                          <td>{row[0] || '-'}</td>
                          <td>{row[1] || '-'}</td>
                          <td>{row[2] || '-'}</td>
                          <td>{row[3] || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedFile && (
                <div className="file-info">
                  <div>
                    <div className="file-info-text">{selectedFile.name}</div>
                    <div className="file-info-size">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-file"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                      setCsvPreview(null)
                      const fileInput = document.getElementById('fileInput') as HTMLInputElement
                      if (fileInput) fileInput.value = ''
                    }}
                    disabled={importing}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="import-button"
              disabled={!selectedFile || importing}
            >
              {importing && <div className="spinner"></div>}
              {importing ? 'Importando convidados...' : 'Importar Convidados'}
            </button>
          </form>

          {importStats && (
            <div className="stats">
              <h3>Estatísticas da Importação</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{importStats.totalRows}</div>
                  <div className="stat-label">Total de Linhas</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{importStats.inserted}</div>
                  <div className="stat-label">Inseridos</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{importStats.errors}</div>
                  <div className="stat-label">Erros</div>
                </div>
              </div>
              {importStats.errorDetails.length > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '14px', color: '#e53e3e', margin: 0 }}>
                      Erros encontrados:
                    </h4>
                    <a
                      href="/admin/import-logs"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📋 Ver Histórico Completo
                    </a>
                  </div>
                  <div className="error-list">
                    {importStats.errorDetails.slice(0, 10).map((error, index) => (
                      <div key={index} className="error-item">
                        Linha {error.row}: {error.error}
                      </div>
                    ))}
                    {importStats.errorDetails.length > 10 && (
                      <div style={{ textAlign: 'center', padding: '12px', color: '#718096', fontSize: '13px' }}>
                        ... e mais {importStats.errorDetails.length - 10} erro(s).
                        <a href="/admin/import-logs" style={{ color: '#667eea', marginLeft: '4px' }}>
                          Ver todos no histórico
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
