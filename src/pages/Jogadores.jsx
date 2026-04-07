import { useState, useEffect, useMemo } from 'react'
import { listarJogadores, criarJogador, atualizarJogador, removerJogador, listarPresencas, salvarPresenca } from '../api'

const jogadorVazio = {
  nome: '', sexo: 'M', convidado: false, apto: true, corte: 0,
  nota_final: '', ataque: 0, passe: 0, levantamento: 0,
  cobertura: 0, bloqueio: 0, saque: 0, esforco: 0, clima: 10
}

const FUNDAMENTOS = [
  { key: 'ataque',       label: 'Ataque' },
  { key: 'passe',        label: 'Passe / Recepção' },
  { key: 'levantamento', label: 'Levantamento' },
  { key: 'cobertura',    label: 'Cobertura' },
  { key: 'bloqueio',     label: 'Bloqueio' },
  { key: 'saque',        label: 'Saque' },
  { key: 'esforco',      label: 'Esforço' },
  { key: 'clima',        label: 'Clima (não pesa)' },
]

function corteIcon(corte) {
  if (corte >= 1)   return <span style={{ color: '#e94560' }}>●●●</span>
  if (corte >= 0.5) return <span style={{ color: '#f5a623' }}>●●</span>
  return <span style={{ color: '#555' }}>●</span>
}

function DetalheJogador({ j, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: '#161616', border: '1px solid #252525', borderRadius: 12,
        padding: 24, minWidth: 300, maxWidth: 400
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#fff', margin: 0 }}>{j.nome}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FUNDAMENTOS.map(f => (
            <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#888', fontSize: 13 }}>{f.label}</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{Number(j[f.key] || 0).toFixed(1)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #252525', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#aaa', fontWeight: 700 }}>Nota Final</span>
            <span style={{ color: '#e94560', fontWeight: 700, fontSize: 15 }}>{Number(j.nota_final || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888', fontSize: 13 }}>Corte</span>
            <span style={{ fontSize: 13 }}>{corteIcon(j.corte)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Jogadores({ data, setData }) {
  const [jogadores, setJogadores]           = useState([])
  const [presencas, setPresencas]           = useState({})
  const [form, setForm]                     = useState(jogadorVazio)
  const [editando, setEditando]             = useState(null)
  const [mostrarForm, setMostrarForm]       = useState(false)
  const [detalhe, setDetalhe]               = useState(null)
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

  async function togglePresenca(jogador_id, apto) {
    if (!apto) return  // não permite marcar presença de inapto
    const atual = presencas[jogador_id] ?? false
    const novo = !atual
    setPresencas(prev => ({ ...prev, [jogador_id]: novo }))
    await salvarPresenca(jogador_id, data, novo)
  }

  async function salvarJogador() {
    if (!form.nome) return alert('Nome é obrigatório.')
    const dados = { ...form }
    if (editando) {
      await atualizarJogador(editando, dados)
    } else {
      await criarJogador(dados)
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
    setForm({
      nome: j.nome, sexo: j.sexo, convidado: j.convidado, apto: j.apto ?? true, corte: j.corte,
      nota_final: j.nota_final, ataque: j.ataque || 0, passe: j.passe || 0,
      levantamento: j.levantamento || 0, cobertura: j.cobertura || 0,
      bloqueio: j.bloqueio || 0, saque: j.saque || 0, esforco: j.esforco || 0, clima: j.clima || 10
    })
    setEditando(j.id)
    setMostrarForm(true)
  }

  function toggleOrdem(campo) {
    if (ordenar === campo) setDirecao(d => d === 'asc' ? 'desc' : 'asc')
    else { setOrdenar(campo); setDirecao('asc') }
  }

  const jogadoresFiltrados = useMemo(() => {
    let lista = [...jogadores]
    if (filtroPresenca === 'presentes') lista = lista.filter(j => presencas[j.id])
    if (filtroPresenca === 'ausentes')  lista = lista.filter(j => !presencas[j.id])
    lista.sort((a, b) => {
      let va, vb
      if (ordenar === 'nome')     { va = a.nome.toLowerCase(); vb = b.nome.toLowerCase() }
      if (ordenar === 'nota')     { va = a.nota_final; vb = b.nota_final }
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

  function F({ campo, label }) {
    const ativo = ordenar === campo
    return (
      <button onClick={() => toggleOrdem(campo)} style={{
        background: ativo ? '#252525' : 'transparent', color: ativo ? '#fff' : '#555',
        border: `1px solid ${ativo ? '#333' : 'transparent'}`,
        borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: ativo ? 600 : 400
      }}>
        {label}{ativo ? (direcao === 'asc' ? ' ↑' : ' ↓') : ''}
      </button>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {detalhe && <DetalheJogador j={detalhe} onClose={() => setDetalhe(null)} />}

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
        <F campo="nome" label="Nome" />
        <F campo="nota" label="Nota" />
        <F campo="corte" label="Corte" />
        <F campo="presenca" label="Presença" />
        <div style={{ marginLeft: 8, display: 'flex', gap: 4 }}>
          {['todos', 'presentes', 'ausentes'].map(f => (
            <button key={f} onClick={() => setFiltroPresenca(f)} style={{
              background: filtroPresenca === f ? '#e94560' : '#1e1e1e',
              color: filtroPresenca === f ? '#fff' : '#555',
              border: '1px solid #333', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12
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

          {/* Linha 1: Nome | Sexo | Convidado | Apto */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 12 }}>
            <div style={{ flex: 3 }}>
              <label style={labelStyle}>NOME</label>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ flex: 1.2 }}>
              <label style={labelStyle}>SEXO</label>
              <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })} style={inputStyle}>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ccc', fontSize: 12, cursor: 'pointer', paddingBottom: 8 }}>
              <input type="checkbox" checked={form.convidado} onChange={e => setForm({ ...form, convidado: e.target.checked })} />
              Conv.
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ccc', fontSize: 12, cursor: 'pointer', paddingBottom: 8 }}>
              <input type="checkbox" checked={form.apto} onChange={e => setForm({ ...form, apto: e.target.checked })} />
              Apto
            </label>
          </div>

          {/* Linha 2: Nota final centralizada */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <label style={{ ...labelStyle, display: 'block', marginBottom: 4 }}>NOTA FINAL (editável)</label>
            <input type="number" min="0" max="10" step="0.01" value={form.nota_final}
              onChange={e => setForm({ ...form, nota_final: parseFloat(e.target.value) })}
              style={{ ...inputStyle, width: 120, textAlign: 'center', fontSize: 18, fontWeight: 700, display: 'inline-block' }} />
          </div>

          {/* Linha 3: Notas por fundamento em grid */}
          <div style={{ borderTop: '1px solid #252525', paddingTop: 12, marginBottom: 12 }}>
            <label style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>NOTAS POR FUNDAMENTO</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {FUNDAMENTOS.map(f => (
                <div key={f.key}>
                  <label style={{ ...labelStyle, fontSize: 10 }}>{f.label.toUpperCase()}</label>
                  <input type="number" min="0" max="10" step="0.1" value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: parseFloat(e.target.value) || 0 })}
                    style={inputStyle} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 50px 36px 36px 60px 70px', padding: '6px 16px', marginBottom: 4, gap: 8 }}>
        <span style={{ color: '#555', fontSize: 11, fontWeight: 600 }}>PRES.</span>
        <span style={{ color: '#555', fontSize: 11, fontWeight: 600 }}>NOME</span>
        <span style={{ color: '#555', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>NOTA</span>
        <span style={{ color: '#555', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>✂</span>
        <span style={{ color: '#555', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>APTO</span>
        <span></span>
        <span></span>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {jogadoresFiltrados.map(j => {
          const inapto = !j.apto
          return (
            <div key={j.id} style={{
              background: '#161616', border: `1px solid ${inapto ? '#2a1a1a' : '#252525'}`,
              borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
              opacity: inapto ? 0.6 : 1
            }}>
              {/* Toggle presença */}
              <div onClick={() => togglePresenca(j.id, j.apto)} style={{
                width: 36, height: 20, borderRadius: 10,
                cursor: inapto ? 'not-allowed' : 'pointer',
                background: presencas[j.id] ? '#e94560' : '#333',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: presencas[j.id] ? 18 : 3, transition: 'left 0.2s'
                }} />
              </div>

              {/* Nome */}
              <span
                onClick={() => setDetalhe(j)}
                style={{ flex: 1, color: j.sexo === 'F' ? '#f8a4c8' : '#ccc', fontWeight: 500, cursor: 'pointer' }}
                title="Ver detalhes"
              >
                {j.nome}
                {j.convidado && <span style={{ color: '#555', fontSize: 11, marginLeft: 4 }}>conv</span>}
              </span>

              {/* Nota final */}
              <span style={{ color: '#fff', fontWeight: 700, width: 50, textAlign: 'center', fontSize: 13 }}>
                {Number(j.nota_final || 0).toFixed(2)}
              </span>

              {/* Corte */}
              <span style={{ width: 36, textAlign: 'center', fontSize: 9 }}>
                {corteIcon(j.corte)}
              </span>

              {/* Apto */}
              <span style={{ width: 36, textAlign: 'center', fontSize: 11 }}>
                {j.apto ? <span style={{ color: '#52b788' }}>✓</span> : <span style={{ color: '#e94560' }}>✗</span>}
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
          )
        })}
      </div>
    </div>
  )
}
