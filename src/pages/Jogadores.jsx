import { useState, useEffect, useMemo } from 'react'
import { listarJogadores, criarJogador, atualizarJogador, removerJogador, listarPresencas, salvarPresenca } from '../api'

const jogadorVazio = { nome: '', sexo: 'M', nota: '', corte: 0, convidado: false }

export default function Jogadores({ data, setData }) {
  const [jogadores, setJogadores]           = useState([])
  const [presencas, setPresencas]           = useState({})
  const [form, setForm]                     = useState(jogadorVazio)
  const [editando, setEditando]             = useState(null)
  const [mostrarForm, setMostrarForm]       = useState(false)
  const [ordenar, setOrdenar]               = useState('nome')
  const [direcao, setDirecao]               = useState('asc')
  const [filtroPresenca, setFiltroPresenca] = useState('todos')

  useEffect(() => { carregarJogadores() }, [])
  useEffect(() => { carregarPresencas() }, [data])

  async function carregarJogadores() {
    const lista = await listarJogadores()
    setJogadores(lista)
  }

  async function carregarPresencas() {
    const lista = await listarPresencas(data)
    const mapa = {}
    lista.forEach(p => { mapa[p.jogador_id] = p.presente })
    setPresencas(mapa)
  }

  async function togglePresenca(jogador_id) {
    const atual = presencas[jogador_id] ?? false
    const novo = !atual
    setPresencas(prev => ({ ...prev, [jogador_id]: novo }))
    await salvarPresenca(jogador_id, data, novo)
  }

  async function salvarJogador() {
    if (!form.nome || !form.nota) return alert('Nome e nota são obrigatórios.')
    if (editando) {
      await atualizarJogador(editando, form)
    } else {
      await criarJogador(form)
    }
    setForm(jogadorVazio)
    setEditando(null)
    setMostrarForm(false)
    carregarJogadores()
  }

  async function excluirJogador(id) {
    if (!confirm('Remover jogador?')) return
    await removerJogador(id)
    carregarJogadores()
  }

  function iniciarEdicao(j) {
    setForm({ nome: j.nome, sexo: j.sexo, nota: j.nota, corte: j.corte, convidado: j.convidado })
    setEditando(j.id)
    setMostrarForm(true)
  }

  function toggleOrdem(campo) {
    if (ordenar === campo) {
      setDirecao(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setOrdenar(campo)
      setDirecao('asc')
    }
  }

  const jogadoresFiltrados = useMemo(() => {
    let lista = [...jogadores]
    if (filtroPresenca === 'presentes') lista = lista.filter(j => presencas[j.id])
    if (filtroPresenca === 'ausentes')  lista = lista.filter(j => !presencas[j.id])
    lista.sort((a, b) => {
      let va, vb
      if (ordenar === 'nome')     { va = a.nome.toLowerCase(); vb = b.nome.toLowerCase() }
      if (ordenar === 'nota')     { va = a.nota; vb = b.nota }
      if (ordenar === 'corte')    { va = a.corte; vb = b.corte }
      if (ordenar === 'presenca') { va = presencas[a.id] ? 1 : 0; vb = presencas[b.id] ? 1 : 0 }
      if (va < vb) return direcao === 'asc' ? -1 : 1
      if (va > vb) return direcao === 'asc' ? 1 : -1
      return 0
    })
    return lista
  }, [jogadores, presencas, ordenar, direcao, filtroPresenca])

  const presentes = jogadores.filter(j => presencas[j.id]).length

  const inputStyle = {
    width: '100%', background: '#1e1e1e', border: '1px solid #333',
    color: '#fff', borderRadius: 6, padding: '7px 8px',
    marginTop: 4, fontSize: 13, boxSizing: 'border-box'
  }
  const labelStyle = { color: '#555', fontSize: 11, fontWeight: 600, letterSpacing: 1 }

  function BotaoOrdem({ campo, label }) {
    const ativo = ordenar === campo
    const seta  = ativo ? (direcao === 'asc' ? ' ↑' : ' ↓') : ''
    return (
      <button onClick={() => toggleOrdem(campo)} style={{
        background: ativo ? '#252525' : 'transparent',
        color: ativo ? '#fff' : '#555',
        border: `1px solid ${ativo ? '#333' : 'transparent'}`,
        borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
        fontSize: 12, fontWeight: ativo ? 600 : 400
      }}>
        {label}{seta}
      </button>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0 }}>Jogadores</h2>
          <span style={{ color: '#555', fontSize: 13 }}>{presentes} de {jogadores.length} presentes</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            style={{ background: '#1e1e1e', border: '1px solid #333', color: '#ccc', borderRadius: 6, padding: '6px 10px' }} />
          <button onClick={() => { setForm(jogadorVazio); setEditando(null); setMostrarForm(true) }}
            style={{ background: '#e94560', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
            + Novo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#555', fontSize: 12 }}>Ordenar:</span>
        <BotaoOrdem campo="nome"     label="Nome" />
        <BotaoOrdem campo="nota"     label="Nota" />
        <BotaoOrdem campo="corte"    label="Corte" />
        <BotaoOrdem campo="presenca" label="Presença" />
        <div style={{ marginLeft: 8, display: 'flex', gap: 4 }}>
          {['todos', 'presentes', 'ausentes'].map(f => (
            <button key={f} onClick={() => setFiltroPresenca(f)} style={{
              background: filtroPresenca === f ? '#e94560' : '#1e1e1e',
              color: filtroPresenca === f ? '#fff' : '#555',
              border: '1px solid #333', borderRadius: 6,
              padding: '4px 10px', cursor: 'pointer', fontSize: 12
            }}>
              {f === 'todos' ? 'Todos' : f === 'presentes' ? 'Presentes' : 'Ausentes'}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <div style={{ background: '#161616', border: '1px solid #252525', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h3 style={{ color: '#fff', margin: '0 0 14px', fontSize: 15 }}>{editando ? 'Editar Jogador' : 'Novo Jogador'}</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 3 }}>
              <label style={labelStyle}>NOME</label>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ flex: 1.5 }}>
              <label style={labelStyle}>SEXO</label>
              <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })} style={inputStyle}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>NOTA</label>
              <input type="number" min="0" max="10" step="0.01" value={form.nota}
                onChange={e => setForm({ ...form, nota: parseFloat(e.target.value) })} style={inputStyle} />
            </div>
            <div style={{ flex: 1.5 }}>
              <label style={labelStyle}>CORTE</label>
              <select value={form.corte} onChange={e => setForm({ ...form, corte: parseFloat(e.target.value) })} style={inputStyle}>
                <option value={0}>● Fraco</option>
                <option value={0.5}>●● Médio</option>
                <option value={1}>●●● Forte</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ccc', fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.convidado} onChange={e => setForm({ ...form, convidado: e.target.checked })} />
              Convidado
            </label>
            <button onClick={salvarJogador}
              style={{ background: '#e94560', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 20px', cursor: 'pointer', fontWeight: 600 }}>
              Salvar
            </button>
            <button onClick={() => { setMostrarForm(false); setEditando(null) }}
              style={{ background: '#252525', color: '#ccc', border: 'none', borderRadius: 6, padding: '7px 20px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Cabeçalho da tabela */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 50px 40px 60px 70px',
        padding: '6px 16px',
        marginBottom: 4,
        gap: 12
      }}>
        <span style={{ color: '#555', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>PRES.</span>
        <span style={{ color: '#555', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>NOME</span>
        <span style={{ color: '#555', fontSize: 11, fontWeight: 600, letterSpacing: 1, textAlign: 'center' }}>NOTA</span>
        <span style={{ color: '#555', fontSize: 11, fontWeight: 600, letterSpacing: 1, textAlign: 'center' }}>CORTE</span>
        <span></span>
        <span></span>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {jogadoresFiltrados.map(j => (
          <div key={j.id} style={{
            background: '#161616', border: '1px solid #252525', borderRadius: 8,
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div onClick={() => togglePresenca(j.id)} style={{
              width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
              background: presencas[j.id] ? '#e94560' : '#333',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0
            }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: presencas[j.id] ? 18 : 3, transition: 'left 0.2s'
              }} />
            </div>
            <span style={{ flex: 1, color: j.sexo === 'F' ? '#f8a4c8' : '#ccc', fontWeight: 500 }}>
              {j.nome} {j.convidado && <span style={{ color: '#555', fontSize: 11 }}>convidado</span>}
            </span>
            <span style={{ color: '#fff', fontWeight: 700, width: 50, textAlign: 'center', fontSize: 13 }}>
              {Number(j.nota).toFixed(2)}
            </span>
            <span style={{ width: 40, textAlign: 'center', fontSize: 9 }}>
              {j.corte >= 1
                ? <span style={{ color: '#e94560' }}>●●●</span>
                : j.corte >= 0.5
                ? <span style={{ color: '#f5a623' }}>●●</span>
                : <span style={{ color: '#555' }}>●</span>}
            </span>
            <button onClick={() => iniciarEdicao(j)}
              style={{ background: '#252525', color: '#ccc', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
              Editar
            </button>
            <button onClick={() => excluirJogador(j.id)}
              style={{ background: '#2a1a1a', color: '#e94560', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
