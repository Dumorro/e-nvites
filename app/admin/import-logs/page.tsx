'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ImportLog {
  id: number
  event_id: number | null
  filename: string | null
  total_rows: number
  inserted: number
  errors: number
  error_details: Array<{ row: number; error: string }> | null
  status: 'completed' | 'partial' | 'failed'
  imported_by: string | null
  created_at: string
  updated_at: string
  events?: { name: string } | null
}

export default function ImportLogsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [logs, setLogs] = useState<ImportLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<ImportLog | null>(null)

  useEffect(() => {
    const password = sessionStorage.getItem('adminPassword')
    if (!password) {
      router.push('/admin')
      return
    }
    setIsAuthenticated(true)
    fetchLogs()
  }, [router])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const password = sessionStorage.getItem('adminPassword')
      const response = await fetch('/api/admin/import-logs', {
        headers: {
          'x-admin-password': password || '',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar logs')
      }

      setLogs(data.logs)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#48bb78'
      case 'partial': return '#ed8936'
      case 'failed': return '#e53e3e'
      default: return '#718096'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completo'
      case 'partial': return 'Parcial'
      case 'failed': return 'Falhou'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
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
          max-width: 1200px;
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

        .logs-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        .logs-table th {
          background-color: #f7fafc;
          padding: 12px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #2d3748;
          border-bottom: 2px solid #e2e8f0;
        }

        .logs-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
          color: #4a5568;
        }

        .logs-table tr:hover {
          background-color: #f7fafc;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .view-button {
          padding: 6px 12px;
          background-color: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .view-button:hover {
          background-color: #5568d3;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 12px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          color: #2d3748;
          font-size: 20px;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          color: #718096;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }

        .close-button:hover {
          background-color: #f7fafc;
          color: #2d3748;
        }

        .modal-body {
          padding: 24px;
        }

        .detail-row {
          display: flex;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .detail-label {
          font-weight: 600;
          color: #2d3748;
          width: 150px;
          flex-shrink: 0;
        }

        .detail-value {
          color: #4a5568;
          flex: 1;
        }

        .error-list {
          margin-top: 16px;
          max-height: 400px;
          overflow-y: auto;
          background-color: #f7fafc;
          border-radius: 8px;
          padding: 16px;
        }

        .error-item {
          padding: 8px;
          margin-bottom: 8px;
          background-color: #fff5f5;
          border-left: 4px solid #e53e3e;
          border-radius: 4px;
          font-size: 13px;
          color: #742a2a;
          font-family: 'Courier New', monospace;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #718096;
        }

        .no-logs {
          text-align: center;
          padding: 60px 20px;
          color: #a0aec0;
        }

        .no-logs-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="container">
        <a href="/admin" className="back-link">
          ← Voltar para Admin
        </a>

        <div className="card">
          <div className="header">
            <h1>Histórico de Importações</h1>
            <p>Visualize todos os logs de importação de convidados realizadas no sistema.</p>
          </div>

          {loading ? (
            <div className="loading">
              <p>Carregando logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="no-logs">
              <div className="no-logs-icon">📋</div>
              <h3>Nenhuma importação realizada ainda</h3>
              <p>Os logs de importação aparecerão aqui após realizar uploads de CSV.</p>
            </div>
          ) : (
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Evento</th>
                  <th>Arquivo</th>
                  <th>Total</th>
                  <th>Inseridos</th>
                  <th>Erros</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>{log.events?.name || 'N/A'}</td>
                    <td>{log.filename || 'N/A'}</td>
                    <td>{log.total_rows}</td>
                    <td>{log.inserted}</td>
                    <td>{log.errors}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(log.status) }}
                      >
                        {getStatusLabel(log.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-button"
                        onClick={() => setSelectedLog(log)}
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes da Importação</h2>
              <button className="close-button" onClick={() => setSelectedLog(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <div className="detail-label">Data/Hora:</div>
                <div className="detail-value">{formatDate(selectedLog.created_at)}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Evento:</div>
                <div className="detail-value">{selectedLog.events?.name || 'N/A'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Arquivo:</div>
                <div className="detail-value">{selectedLog.filename || 'N/A'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Status:</div>
                <div className="detail-value">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedLog.status) }}
                  >
                    {getStatusLabel(selectedLog.status)}
                  </span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Total de Linhas:</div>
                <div className="detail-value">{selectedLog.total_rows}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Inseridos:</div>
                <div className="detail-value" style={{ color: '#48bb78', fontWeight: 600 }}>
                  {selectedLog.inserted}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Erros:</div>
                <div className="detail-value" style={{ color: '#e53e3e', fontWeight: 600 }}>
                  {selectedLog.errors}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Importado por:</div>
                <div className="detail-value">{selectedLog.imported_by || 'N/A'}</div>
              </div>

              {selectedLog.error_details && selectedLog.error_details.length > 0 && (
                <>
                  <div style={{ marginTop: '24px', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '16px', color: '#2d3748' }}>
                      Detalhes dos Erros ({selectedLog.error_details.length})
                    </h3>
                  </div>
                  <div className="error-list">
                    {selectedLog.error_details.map((error, index) => (
                      <div key={index} className="error-item">
                        <strong>Linha {error.row}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
