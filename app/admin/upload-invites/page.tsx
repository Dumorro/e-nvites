'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UploadStats {
  total: number
  updated: number
  notFound: number
  files: string[]
  notFoundFiles: string[]
}

export default function UploadInvitesPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string>('1')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)

  useEffect(() => {
    const password = sessionStorage.getItem('adminPassword')
    if (!password) {
      router.push('/admin')
      return
    }
    setIsAuthenticated(true)
  }, [router])

  const events = [
    { id: '1', name: 'Rio de Janeiro (oil-celebration-rj)', folder: 'oil-celebration-rj' },
    { id: '2', name: 'São Paulo (oil-celebration-sp)', folder: 'oil-celebration-sp' },
    { id: '7', name: 'Festa de Fim de Ano (festa-equinor)', folder: 'festa-equinor' },
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.zip')) {
        setMessage({ type: 'error', text: 'Por favor, selecione um arquivo ZIP' })
        return
      }
      setSelectedFile(file)
      setMessage(null)
      setUploadStats(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Selecione um arquivo ZIP primeiro' })
      return
    }

    try {
      setUploading(true)
      setMessage(null)
      setUploadStats(null)

      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('eventId', selectedEvent)

      const password = sessionStorage.getItem('adminPassword')
      const response = await fetch('/api/admin/upload-invites-db', {
        method: 'POST',
        headers: {
          'x-admin-password': password || '',
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      setMessage({ type: 'success', text: data.message })
      setUploadStats(data.stats)
      setSelectedFile(null)

      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Erro ao fazer upload',
      })
    } finally {
      setUploading(false)
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
          max-width: 800px;
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

        .upload-button {
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

        .upload-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .upload-button:disabled {
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

        .file-list {
          max-height: 200px;
          overflow-y: auto;
          padding: 12px;
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .file-list-item {
          padding: 8px;
          font-size: 12px;
          color: #4a5568;
          border-bottom: 1px solid #e2e8f0;
        }

        .file-list-item:last-child {
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
            <h1>Upload de Convites</h1>
            <p>Faça upload de um arquivo ZIP com os convites do evento. As imagens serão salvas no banco de dados.</p>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }}>
            <div className="form-group">
              <label htmlFor="eventSelect">Selecione o Evento</label>
              <select
                id="eventSelect"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                disabled={uploading}
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Arquivo ZIP</label>
              <div
                className={`dropzone ${selectedFile ? 'active' : ''}`}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <div className="dropzone-icon">📦</div>
                <div className="dropzone-text">
                  {selectedFile ? 'Arquivo selecionado!' : 'Clique para selecionar um arquivo ZIP'}
                </div>
                <div className="dropzone-hint">
                  {selectedFile ? selectedFile.name : 'Ou arraste e solte aqui'}
                </div>
              </div>

              {selectedFile && (
                <div className="file-info">
                  <div>
                    <div className="file-info-text">{selectedFile.name}</div>
                    <div className="file-info-size">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button
                    type="button"
                    className="remove-file"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                      const fileInput = document.getElementById('fileInput') as HTMLInputElement
                      if (fileInput) fileInput.value = ''
                    }}
                    disabled={uploading}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="upload-button"
              disabled={!selectedFile || uploading}
            >
              {uploading && <div className="spinner"></div>}
              {uploading ? 'Fazendo upload...' : 'Fazer Upload'}
            </button>
          </form>

          {uploadStats && (
            <div className="stats">
              <h3>Estatísticas do Upload</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{uploadStats.total}</div>
                  <div className="stat-label">Processados</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{uploadStats.updated}</div>
                  <div className="stat-label">Atualizados</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{uploadStats.notFound}</div>
                  <div className="stat-label">Não Encontrados</div>
                </div>
              </div>
              {uploadStats.files.length > 0 && (
                <>
                  <h4 style={{ fontSize: '14px', color: '#4a5568', marginBottom: '8px' }}>
                    Arquivos processados com sucesso:
                  </h4>
                  <div className="file-list">
                    {uploadStats.files.map((file, index) => (
                      <div key={index} className="file-list-item">
                        ✅ {file}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {uploadStats.notFoundFiles.length > 0 && (
                <>
                  <h4 style={{ fontSize: '14px', color: '#e53e3e', marginTop: '16px', marginBottom: '8px' }}>
                    Arquivos não encontrados no banco:
                  </h4>
                  <div className="file-list">
                    {uploadStats.notFoundFiles.map((file, index) => (
                      <div key={index} className="file-list-item" style={{ color: '#e53e3e' }}>
                        ⚠️ {file}
                      </div>
                    ))}
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
