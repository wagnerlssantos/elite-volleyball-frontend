import axios from 'axios'

const api = axios.create({
  baseURL: 'https://elite-volleyball-backend.onrender.com',
})

// ── Jogadores ──────────────────────────────────────────────
export const listarJogadores = () =>
  api.get('/jogadores').then(r => r.data)

export const criarJogador = (dados) =>
  api.post('/jogadores', dados).then(r => r.data)

export const atualizarJogador = (id, dados) =>
  api.patch(`/jogadores/${id}`, dados).then(r => r.data)

export const removerJogador = (id) =>
  api.delete(`/jogadores/${id}`).then(r => r.data)

// ── Presenças ──────────────────────────────────────────────
export const listarPresencas = (data) =>
  api.get(`/presencas/${data}`).then(r => r.data)

export const salvarPresenca = (jogador_id, data_jogo, presente) =>
  api.post('/presencas', { jogador_id, data_jogo, presente }).then(r => r.data)

// ── Sorteio ────────────────────────────────────────────────
export const sortear = (data) =>
  api.get(`/sortear/${data}`).then(r => r.data)