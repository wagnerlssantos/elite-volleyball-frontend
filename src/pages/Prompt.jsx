import { useState, useEffect } from 'react'

const MESES = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO']

function formatarDataExtenso(data) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return `${parseInt(dia)} DE ${MESES[parseInt(mes) - 1]} DE ${ano}`
}

function gerarListaTimes(times) {
  let txt = ''
  times.forEach((time, i) => {
    txt += `Time ${i + 1}:\n`
    time.forEach(j => {
      const nome = j.nome.replace(/\s*-\s*conv\s*$/i, '').trim()
      txt += `${nome}\n`
    })
    txt += '\n'
  })
  return txt
}

function gerarPromptCompleto(data, times) {
  const dataExtenso = formatarDataExtenso(data)
  const listaTimes  = gerarListaTimes(times)
  return `Poster esportivo profissional de escalação de time de vôlei, formato vertical 4:5 (estilo Instagram), resolução 4K, qualidade ultra detalhada.

Cenário:
Quadra de vôlei iluminada à noite, com luzes fortes de estádio ao fundo, atmosfera dramática e cinematográfica. Partículas douradas flutuando no ar, efeito glow e profundidade de campo.

Paleta de cores:
Preto predominante, dourado metálico com brilho intenso, detalhes sutis em verde, vermelho e amarelo.

🏆 Elementos principais

Topo:
Título grande em tipografia esportiva moderna:
"TlMES DA NOlTE"
"NOITE" em dourado metálico com brilho
restante em branco com leve glow

Logo abaixo:
Data do evento (formato: DD DE MÊS DE AAAA)

🛡️ Centro da arte
Escudo estilizado com texto:
ELITE VOLLEYBALL TEAM
com acabamento metálico dourado/preto e três estrelas acima
Integrado ao layout:

🦅 Mascote oficial
Gavião guerreiro estilizado, forte e imponente, com expressão determinada
Vestindo uniforme preto e dourado com detalhes verde, vermelho e amarelo
Posição do mascote (variável, mas sempre impactante):
ao lado do escudo segurando bola de vôlei
OU
atrás do escudo com postura dominante
OU
braços cruzados transmitindo liderança

🔥 Seção dos times
Texto central:
"Times sorteados:"
Abaixo, 3 caixas lado a lado, com:
bordas douradas brilhantes
leve efeito neon/glow
fundo escuro com transparência
Cada caixa contém:
🔥 Time 1
🔥 Time 2
🔥 Time 3
Nomes dos jogadores:
tipografia branca moderna
bem espaçada
centralizada
alta legibilidade

🎯 Rodapé
Faixa inferior escura com borda dourada
Texto:
"🏐 Bom jogo a todos! 😄"
(emoji sempre feliz)

✨ Estilo geral
Luxuoso e esportivo
Visual de campeonato profissional
Alto contraste
Iluminação dramática
Sombras suaves
Profundidade de campo
Acabamento cinematográfico
Design digno de clube profissional

⚙️ Dados do sorteio

Data: ${dataExtenso}

${listaTimes}`
}

const boxStyle = {
  background: '#161616', border: '1px solid #252525',
  borderRadius: 8, padding: '14px 16px', width: '100%', boxSizing: 'border-box'
}

const preStyle = {
  color: '#888', fontSize: 12, margin: 0,
  whiteSpace: 'pre-wrap', fontFamily: 'monospace',
  lineHeight: 1.7, wordBreak: 'break-word'
}

export default function Prompt({ data, opcoes }) {
  const [opcaoSelecionada, setOpcaoSelecionada] = useState(null)
  const [textoEditavel, setTextoEditavel]       = useState('')
  const [copiado, setCopiado]                   = useState(false)

  useEffect(() => {
    if (opcaoSelecionada !== null && opcoes) {
      const times = opcoes[opcaoSelecionada]
      const lista = gerarListaTimes(times)
      const dataExtenso = formatarDataExtenso(data)
      setTextoEditavel(`refaça a imagem com a data e times abaixo:\n\nData: ${dataExtenso}\n\n${lista}`)
    }
  }, [opcaoSelecionada, data, opcoes])

  function copiar() {
    navigator.clipboard.writeText(textoEditavel)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (!opcoes) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📸</div>
        <p style={{ color: '#555', fontSize: 15 }}>Primeiro faça o sorteio na aba <strong style={{ color: '#ccc' }}>Sortear Times</strong>.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ color: '#fff', marginBottom: 6, fontSize: 18 }}>📸 Prompt para Instagram</h2>
      <p style={{ color: '#555', fontSize: 13, marginBottom: 16 }}>Selecione a opção escolhida pelo grupo.</p>

      {/* Seleção */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {opcoes.map((_, i) => (
          <button key={i} onClick={() => setOpcaoSelecionada(i)} style={{
            background: opcaoSelecionada === i ? '#e94560' : '#161616',
            color: opcaoSelecionada === i ? '#fff' : '#aaa',
            border: `1px solid ${opcaoSelecionada === i ? '#e94560' : '#252525'}`,
            borderRadius: 8, padding: '7px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13
          }}>
            Opção {i + 1}
          </button>
        ))}
      </div>

      {opcaoSelecionada !== null && (
        <>
          {/* Texto editável */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ color: '#aaa', fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>TEXTO EDITÁVEL</label>
              <button onClick={copiar} style={{
                background: copiado ? '#1b4332' : '#252525',
                color: copiado ? '#52b788' : '#ccc',
                border: 'none', borderRadius: 6, padding: '5px 14px',
                cursor: 'pointer', fontWeight: 600, fontSize: 12
              }}>
                {copiado ? '✓ Copiado!' : 'Copiar'}
              </button>
            </div>
            <textarea
              value={textoEditavel}
              onChange={e => setTextoEditavel(e.target.value)}
              rows={10}
              style={{
                ...boxStyle, color: '#ccc', fontSize: 12,
                fontFamily: 'monospace', resize: 'vertical',
                lineHeight: 1.6, border: '1px solid #333',
                wordBreak: 'break-word'
              }}
            />
          </div>

          {/* Prompt base */}
          <div>
            <div style={{ color: '#aaa', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
              🎯 PROMPT BASE
            </div>
            <div style={boxStyle}>
              <pre style={preStyle}>
                {gerarPromptCompleto(data, opcoes[opcaoSelecionada])}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
