import { useState, useEffect } from 'react'
import { listarPesos, atualizarPeso } from '../api'

const LABELS = {
  ataque: 'Ataque',
  passe: 'Passe / Recepção',
  levantamento: 'Levantamento',
  cobertura: 'Cobertura',
  bloqueio: 'Bloqueio',
  saque: 'Saque',
  esforco: 'Esforço',
}

export default function Pesos() {
  const [pesos, setPesos]       = useState([])
  const [editados, setEditados] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk]             = useState(false)

  useEffect(() => { listarPesos().then(setPesos) }, [])

  function onChange(fundamento, valor) {
    setEditados(prev => ({ ...prev, [fundamento]: valor }))
  }

  function valorAtual(p) {
    return editados[p.fundamento] !== undefined ? editados[p.fundamento] : (Number(p.peso) * 100).toFixed(0)
  }

  const totalEditado = pesos.reduce((sum, p) => {
    const v = editados[p.fundamento] !== undefined ? Number(editados[p.fundamento]) : Number(p.peso) * 100
    return sum + v
  }, 0)

  async function salvar() {
    if (Math.round(totalEditado) !== 100) return alert('A soma dos pesos deve ser 100%.')
    setSalvando(true)
    for (const [fundamento, valor] of Object.entries(editados)) {
      await atualizarPeso(fundamento, Number(valor) / 100)
    }
    const lista = await listarPesos()
    setPesos(lista)
    setEditados({})
    setSalvando(false)
    setOk(true)
    setTimeout(() => setOk(false), 2000)
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h2 style={{ color: '#fff', marginBottom: 6, fontSize: 18 }}>⚖️ Pesos dos Fundamentos</h2>
      <p style={{ color: '#555', fontSize: 13, marginBottom: 20 }}>
        Ao salvar, todas as notas finais serão recalculadas automaticamente.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {pesos.map(p => (
          <div key={p.fundamento} style={{
            background: '#161616', border: '1px solid #252525', borderRadius: 8,
            padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <span style={{ flex: 1, color: '#ccc', fontSize: 14 }}>{LABELS[p.fundamento] || p.fundamento}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number" min="0" max="100" step="1"
                value={valorAtual(p)}
                onChange={e => onChange(p.fundamento, e.target.value)}
                style={{
                  width: 60, background: '#1e1e1e', border: '1px solid #333',
                  color: '#fff', borderRadius: 6, padding: '5px 8px',
                  fontSize: 14, fontWeight: 700, textAlign: 'center'
                }}
              />
              <span style={{ color: '#555', fontSize: 13 }}>%</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <span style={{ color: Math.round(totalEditado) === 100 ? '#52b788' : '#e94560', fontWeight: 700, fontSize: 14 }}>
          Total: {totalEditado.toFixed(0)}%
        </span>
        <button onClick={salvar} disabled={salvando} style={{
          background: '#e94560', color: '#fff', border: 'none', borderRadius: 6,
          padding: '8px 20px', cursor: salvando ? 'not-allowed' : 'pointer',
          fontWeight: 600, opacity: salvando ? 0.7 : 1
        }}>
          {salvando ? 'Salvando...' : ok ? '✓ Salvo!' : 'Salvar pesos'}
        </button>
        <span style={{ color: '#555', fontSize: 12 }}>Recalcula todas as notas ao salvar</span>
      </div>
    </div>
  )
}
