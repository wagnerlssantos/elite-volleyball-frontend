import { useState, useRef } from 'react'
import { sortear } from '../api'
import html2canvas from 'html2canvas'

const CORES = [
  { header: '#1a1a2e', badge: '#e94560' },
  { header: '#0f3460', badge: '#4fc3f7' },
  { header: '#1b4332', badge: '#52b788' },
]

function corteIcon(corte) {
  if (corte >= 1)   return <span style={{ color: '#e94560', fontSize: 9 }}>●●●</span>
  if (corte >= 0.5) return <span style={{ color: '#f5a623', fontSize: 9 }}>●●</span>
  return <span style={{ color: '#333', fontSize: 9 }}>●</span>
}

function CardTime({ time, numTime, cores }) {
  const media     = (time.reduce((s, j) => s + j.nota_final, 0) / time.length).toFixed(2)
  const somaCorte = time.reduce((s, j) => s + (j.corte || 0), 0).toFixed(1)
  const badgeBg   = cores.badge + '22'

  return (
    <div style={{ background: '#161616', border: '1px solid #252525', borderRadius: 6, overflow: 'hidden', flex: 1, minWidth: 180 }}>
      <div style={{ background: cores.header, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>Time {numTime}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ background: badgeBg, border: `1px solid ${cores.badge}`, color: '#eee', borderRadius: 20, padding: '1px 5px', fontSize: 10 }}>★ {media}</span>
          <span style={{ background: badgeBg, border: `1px solid ${cores.badge}`, color: '#eee', borderRadius: 20, padding: '1px 5px', fontSize: 10 }}>✂ {somaCorte}</span>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#1a1a1a' }}>
            <th style={{ color: '#444', fontSize: 9, padding: '4px 8px', textAlign: 'left', fontWeight: 600, letterSpacing: 1 }}>JOGADOR</th>
            <th style={{ color: '#444', fontSize: 9, padding: '4px 6px', textAlign: 'center', fontWeight: 600 }}>NOTA</th>
            <th style={{ color: '#444', fontSize: 9, padding: '4px 6px', textAlign: 'center', fontWeight: 600 }}>✂</th>
          </tr>
        </thead>
        <tbody>
          {time.map((j, i) => (
            <tr key={i} style={{ borderTop: '1px solid #1e1e1e' }}>
              <td style={{ padding: '4px 8px', color: j.sexo === 'F' || j.sexo === 'f' ? '#f8a4c8' : '#ccc', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {(j.sexo === 'F' || j.sexo === 'f') ? '♀ ' : ''}{j.nome}
                {j.convidado && <span style={{ color: '#555', fontSize: 9, marginLeft: 4 }}>c</span>}
              </td>
              <td style={{ padding: '4px 6px', textAlign: 'center', color: '#fff', fontWeight: 700 }}>{j.nota_final}</td>
              <td style={{ padding: '4px 6px', textAlign: 'center' }}>{corteIcon(j.corte)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TextoWhatsapp({ opcoes, data }) {
  const [copiado, setCopiado] = useState(null)

  function formatarData(d) {
    if (!d) return ''
    const [ano, mes, dia] = d.split('-')
    return `${dia}/${mes}/${ano}`
  }

  function gerarTexto(times, numOpcao) {
    let txt = `🏆 *ELITE VOLLEYBALL TEAM*\n`
    txt += `📅 ${formatarData(data)}\n\n`
    times.forEach((time, i) => {
      txt += `🔥 *Time ${i + 1}:*\n`
      time.forEach(j => {
        const nome = j.nome.replace(/\s*-\s*conv\s*$/i, '').trim()
        txt += `   ➤ ${nome}\n`
      })
      txt += '\n'
    })
    return txt
  }

  function copiar(times, numOpcao) {
    navigator.clipboard.writeText(gerarTexto(times, numOpcao))
    setCopiado(numOpcao)
    setTimeout(() => setCopiado(null), 2000)
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ color: '#fff', marginBottom: 12, fontSize: 13 }}>📱 Versão WhatsApp</h3>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', gap: 10, minWidth: 600 }}>
          {opcoes.map((times, i) => (
            <div key={i} style={{ background: '#161616', border: '1px solid #252525', borderRadius: 8, padding: 10, flex: 1, minWidth: 180 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: '#aaa', fontWeight: 700, letterSpacing: 2, fontSize: 11 }}>OPÇÃO {i + 1}</span>
                <button onClick={() => copiar(times, i + 1)} style={{
                  background: copiado === i + 1 ? '#1b4332' : '#252525',
                  color: copiado === i + 1 ? '#52b788' : '#ccc',
                  border: 'none', borderRadius: 6, padding: '3px 8px',
                  cursor: 'pointer', fontWeight: 600, fontSize: 11
                }}>
                  {copiado === i + 1 ? '✓ Copiado!' : 'Copiar'}
                </button>
              </div>
              <pre style={{ color: '#ccc', fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {gerarTexto(times, i + 1)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Sorteio({ data, setData, opcoes, setOpcoes }) {
  const [loading, setLoading]   = useState(false)
  const [erro, setErro]         = useState(null)
  const [baixando, setBaixando] = useState(false)
  const comparadorRef           = useRef(null)

  async function rodarSorteio() {
    setLoading(true)
    setErro(null)
    setOpcoes(null)
    try {
      const res = await sortear(data)
      setOpcoes(res.opcoes)
    } catch (e) {
      setErro(e.response?.data?.detail || 'Erro ao sortear.')
    } finally {
      setLoading(false)
    }
  }

  async function baixarImagem() {
    if (!comparadorRef.current) return
    setBaixando(true)
    try {
      const canvas = await html2canvas(comparadorRef.current, {
        backgroundColor: '#0d0d0d', scale: 2, useCORS: true,
      })
      const link    = document.createElement('a')
      link.download = `times_${data}.png`
      link.href     = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setBaixando(false)
    }
  }

  return (
    <div>
      {/* Cabeçalho — scroll horizontal no mobile */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, minWidth: 480 }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: 18, whiteSpace: 'nowrap' }}>Sortear Times</h2>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            style={{ background: '#1e1e1e', border: '1px solid #333', color: '#ccc', borderRadius: 6, padding: '5px 10px', fontSize: 13 }} />
          <button onClick={rodarSorteio} disabled={loading} style={{
            background: '#e94560', color: '#fff', border: 'none', borderRadius: 6,
            padding: '7px 20px', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 14, opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap'
          }}>
            {loading ? 'Sorteando...' : '🎲 Sortear'}
          </button>
          {opcoes && (
            <button onClick={baixarImagem} disabled={baixando} style={{
              background: '#252525', color: baixando ? '#555' : '#ccc',
              border: '1px solid #333', borderRadius: 6,
              padding: '7px 16px', cursor: baixando ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap'
            }}>
              {baixando ? 'Gerando...' : '⬇ Baixar imagem'}
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div style={{ background: '#2a1a1a', border: '1px solid #e94560', borderRadius: 8, padding: 12, color: '#e94560', marginBottom: 16, fontSize: 13 }}>
          ❌ {erro}
        </div>
      )}

      {opcoes && (
        <>
          {/* Comparador com scroll horizontal */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div ref={comparadorRef} style={{ background: '#0d0d0d', padding: 8, minWidth: 600 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {opcoes.map((times, i) => (
                  <div key={i}>
                    <div style={{ color: '#555', fontWeight: 700, letterSpacing: 3, fontSize: 11, textAlign: 'center', marginBottom: 6 }}>
                      OPÇÃO {i + 1}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {times.map((time, j) => (
                        <CardTime key={j} time={time} numTime={j + 1} cores={CORES[j % CORES.length]} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <TextoWhatsapp opcoes={opcoes} data={data} />
        </>
      )}
    </div>
  )
}
