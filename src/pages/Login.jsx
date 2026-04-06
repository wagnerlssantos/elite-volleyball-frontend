import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [erro, setErro]         = useState(null)
  const [loading, setLoading]   = useState(false)

  async function entrar() {
    setLoading(true)
    setErro(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha incorretos.')
    } else {
      onLogin(data.user)
    }
    setLoading(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') entrar()
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0d0d',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#161616', border: '1px solid #252525',
        borderRadius: 12, padding: 40, width: '100%', maxWidth: 380
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏐</div>
          <h1 style={{ color: '#fff', fontSize: 20, margin: 0 }}>Elite Volleyball</h1>
          <p style={{ color: '#555', fontSize: 13, marginTop: 6 }}>Acesso restrito aos administradores</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ color: '#555', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>E-MAIL</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%', background: '#1e1e1e', border: '1px solid #333',
                color: '#fff', borderRadius: 6, padding: '10px 12px',
                marginTop: 4, fontSize: 14, boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ color: '#555', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>SENHA</label>
            <input
              type="password" value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%', background: '#1e1e1e', border: '1px solid #333',
                color: '#fff', borderRadius: 6, padding: '10px 12px',
                marginTop: 4, fontSize: 14, boxSizing: 'border-box'
              }}
            />
          </div>

          {erro && (
            <div style={{ background: '#2a1a1a', border: '1px solid #e94560', borderRadius: 6, padding: '10px 12px', color: '#e94560', fontSize: 13 }}>
              ❌ {erro}
            </div>
          )}

          <button onClick={entrar} disabled={loading} style={{
            background: '#e94560', color: '#fff', border: 'none',
            borderRadius: 6, padding: '11px', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 15, opacity: loading ? 0.7 : 1, marginTop: 4
          }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  )
}