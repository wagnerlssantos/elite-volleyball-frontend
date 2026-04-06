import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Jogadores from './pages/Jogadores'
import Sorteio from './pages/Sorteio'
import Prompt from './pages/Prompt'

const hoje = new Date().toISOString().split('T')[0]

export default function App() {
  const [tela, setTela]     = useState('jogadores')
  const [data, setData]     = useState(hoje)
  const [opcoes, setOpcoes] = useState(null)
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  // Verifica se já há sessão ativa ao carregar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      setCarregando(false)
    })

    // Escuta mudanças de sessão (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    setUsuario(null)
    setOpcoes(null)
    setTela('jogadores')
  }

  const navBtn = (id, label) => (
    <button onClick={() => setTela(id)} style={{
      background: tela === id ? '#e94560' : 'transparent',
      color: '#fff', border: 'none', borderRadius: 6,
      padding: '6px 16px', cursor: 'pointer', fontWeight: 600
    }}>{label}</button>
  )

  if (carregando) return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#555' }}>Carregando...</span>
    </div>
  )

  if (!usuario) return <Login onLogin={setUsuario} />

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#ccc', fontFamily: 'sans-serif' }}>
      <nav style={{
        background: '#161616', borderBottom: '1px solid #252525',
        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <span style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginRight: 8 }}>🏐 Elite Volleyball</span>
        {navBtn('jogadores', 'Jogadores')}
        {navBtn('sorteio', 'Sortear Times')}
        {navBtn('prompt', '📸 Prompt Instagram')}

        {/* Info do usuário + botão sair */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#555', fontSize: 12 }}>{usuario.email}</span>
          <button onClick={sair} style={{
            background: 'transparent', color: '#555', border: '1px solid #333',
            borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12
          }}>
            Sair
          </button>
        </div>
      </nav>
      <main style={{ padding: '20px 24px' }}>
        {tela === 'jogadores' && <Jogadores data={data} setData={setData} />}
        {tela === 'sorteio'   && <Sorteio data={data} setData={setData} opcoes={opcoes} setOpcoes={setOpcoes} />}
        {tela === 'prompt'    && <Prompt data={data} opcoes={opcoes} />}
      </main>
    </div>
  )
}
