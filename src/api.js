import axios from 'axios'

const api = axios.create({
  //baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  baseURL: 'https://elite-volleyball-backend.onrender.com',
})

export const listarJogadores  = () => api.get('/jogadores').then(r => r.data)
export const criarJogador     = (d) => api.post('/jogadores', d).then(r => r.data)
export const atualizarJogador = (id, d) => api.patch(`/jogadores/${id}`, d).then(r => r.data)
export const removerJogador   = (id) => api.delete(`/jogadores/${id}`).then(r => r.data)

export const listarPresencas  = (data) => api.get(`/presencas/${data}`).then(r => r.data)
export const salvarPresenca   = (jogador_id, data_jogo, presente) =>
  api.post('/presencas', { jogador_id, data_jogo, presente }).then(r => r.data)

export const listarPesos      = () => api.get('/pesos').then(r => r.data)
export const atualizarPeso    = (fundamento, peso) =>
  api.patch(`/pesos/${fundamento}`, { peso }).then(r => r.data)

export const sortear          = (data) => api.get(`/sortear/${data}`).then(r => r.data)
