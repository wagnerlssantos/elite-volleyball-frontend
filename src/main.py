from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv
from datetime import date
import os, pandas as pd, hashlib

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# ── Configurações do sorteio ───────────────────────────────────────────────
PESO_NOTA             = 1.0
PESO_CORTE            = 0.5
NOTA_FRACA_LIMITE     = 4.0
PESO_CONCENTRACAO     = 0.4
PESO_CONCENTRACAO_F   = 0.6
NOTA_FORTE_LIMITE     = 7.79
PESO_CONCENTRACAO_TOP = 0.4
PESO_SEM_CORTE_FORTE  = 0.5
PESO_CONVIDADO_EXTRA  = 0.3
NUM_ITERACOES         = 500
NUM_OPCOES            = 3

# ── Lógica de sorteio ──────────────────────────────────────────────────────
def calcular_score(times_df):
    medias = [t['nota_final'].mean() for t in times_df]
    cortes = [t['corte'].sum() for t in times_df]
    score  = (max(medias) - min(medias)) * PESO_NOTA
    score += (max(cortes) - min(cortes)) * PESO_CORTE
    for t in times_df:
        fracos   = t[t['nota_final'] < NOTA_FRACA_LIMITE]
        fracas_f = fracos[fracos['sexo'] == 'f']
        score += max(0, len(fracos)   - 1) * PESO_CONCENTRACAO
        score += max(0, len(fracas_f) - 1) * PESO_CONCENTRACAO_F
        fortes = t[t['nota_final'] >= NOTA_FORTE_LIMITE]
        score += max(0, len(fortes) - 1) * PESO_CONCENTRACAO_TOP
        if not (t['corte'] >= 1.0).any():
            score += PESO_SEM_CORTE_FORTE
        convidados = t[t['convidado'] == True]
        score += max(0, len(convidados) - 1) * PESO_CONVIDADO_EXTRA
    return round(score, 4)


def fingerprint_times(times_df):
    conjuntos = [frozenset(t['nome'].tolist()) for t in times_df]
    chave = str(sorted([sorted(list(c)) for c in conjuntos]))
    return hashlib.md5(chave.encode()).hexdigest()


def gerar_sorteio(df, num_times):
    mulheres  = df[df['sexo'] == 'f'].sample(frac=1).reset_index(drop=True)
    restantes = df[df['sexo'] != 'f'].sample(frac=1).reset_index(drop=True)
    total         = len(df)
    distrib_total = [total // num_times + (1 if i < total % num_times else 0) for i in range(num_times)]
    total_f       = len(mulheres)
    distrib_f     = [total_f // num_times + (1 if i < total_f % num_times else 0) for i in range(num_times)]
    times = [[] for _ in range(num_times)]
    idx_f, idx_r = 0, 0
    for i in range(num_times):
        times[i].extend(mulheres.iloc[idx_f:idx_f + distrib_f[i]].to_dict('records'))
        idx_f += distrib_f[i]
        faltam = distrib_total[i] - len(times[i])
        times[i].extend(restantes.iloc[idx_r:idx_r + faltam].to_dict('records'))
        idx_r += faltam
    return [pd.DataFrame(t) for t in times]


def montar_times(df, num_times):
    candidatos = {}
    for _ in range(NUM_ITERACOES):
        times_df = gerar_sorteio(df, num_times)
        score    = calcular_score(times_df)
        fp       = fingerprint_times(times_df)
        if fp not in candidatos or score < candidatos[fp][0]:
            candidatos[fp] = (score, times_df)
    melhores = sorted(candidatos.values(), key=lambda x: x[0])
    return [times for _, times in melhores[:NUM_OPCOES]]


# ── Helpers ────────────────────────────────────────────────────────────────
def calcular_nota_final(j, pesos):
    """Recalcula nota_final de um jogador usando os pesos. Pula se todas as notas individuais forem 0."""
    campos = ['ataque', 'passe', 'levantamento', 'cobertura', 'bloqueio', 'saque', 'esforco']
    valores = [j.get(c, 0) or 0 for c in campos]
    if all(v == 0 for v in valores):
        return j.get('nota_final') or 0  # mantém nota manual
    nota = sum(j.get(c, 0) * pesos.get(c, 0) for c in campos)
    return round(nota, 2)


def buscar_pesos():
    res = supabase.table("pesos").select("*").execute()
    return {p['fundamento']: float(p['peso']) for p in res.data}


# ── Endpoints: Jogadores ───────────────────────────────────────────────────
@app.get("/jogadores")
def listar_jogadores():
    res = supabase.table("jogadores").select("*").eq("ativo", True).order("nome").execute()
    return res.data


@app.post("/jogadores")
def criar_jogador(jogador: dict):
    res = supabase.table("jogadores").insert(jogador).execute()
    return res.data


@app.patch("/jogadores/{id}")
def atualizar_jogador(id: int, dados: dict):
    # Se vieram notas individuais, recalcula nota_final
    campos_nota = ['ataque', 'passe', 'levantamento', 'cobertura', 'bloqueio', 'saque', 'esforco']
    if any(c in dados for c in campos_nota):
        jogador_res = supabase.table("jogadores").select("*").eq("id", id).execute()
        if jogador_res.data:
            j = {**jogador_res.data[0], **dados}
            pesos = buscar_pesos()
            nota = calcular_nota_final(j, pesos)
            if nota > 0:
                dados['nota_final'] = nota
    res = supabase.table("jogadores").update(dados).eq("id", id).execute()
    return res.data


@app.delete("/jogadores/{id}")
def remover_jogador(id: int):
    supabase.table("jogadores").update({"ativo": False}).eq("id", id).execute()
    return {"ok": True}


# ── Endpoints: Presenças ───────────────────────────────────────────────────
@app.get("/presencas/{data_jogo}")
def listar_presencas(data_jogo: str):
    res = supabase.table("presencas").select("*").eq("data_jogo", data_jogo).execute()
    return res.data


@app.post("/presencas")
def salvar_presenca(dados: dict):
    res = supabase.table("presencas").upsert(dados).execute()
    return res.data


# ── Endpoints: Pesos ───────────────────────────────────────────────────────
@app.get("/pesos")
def listar_pesos():
    res = supabase.table("pesos").select("*").order("fundamento").execute()
    return res.data


@app.patch("/pesos/{fundamento}")
def atualizar_peso(fundamento: str, dados: dict):
    # Atualiza o peso
    supabase.table("pesos").update({"peso": dados["peso"]}).eq("fundamento", fundamento).execute()

    # Recalcula nota_final de todos os jogadores ativos
    pesos = buscar_pesos()
    jogadores = supabase.table("jogadores").select("*").eq("ativo", True).execute()
    for j in jogadores.data:
        nota = calcular_nota_final(j, pesos)
        if nota > 0:
            supabase.table("jogadores").update({"nota_final": nota}).eq("id", j["id"]).execute()

    return {"ok": True}


# ── Endpoint: Sorteio ──────────────────────────────────────────────────────
@app.get("/sortear/{data_jogo}")
def sortear(data_jogo: str):
    presencas = supabase.table("presencas").select("jogador_id").eq("data_jogo", data_jogo).eq("presente", True).execute()
    ids = [p["jogador_id"] for p in presencas.data]

    if not ids:
        raise HTTPException(status_code=400, detail="Nenhum jogador marcado como presente.")

    # Só jogadores aptos
    jogadores = supabase.table("jogadores").select("*").in_("id", ids).eq("apto", True).execute()
    df = pd.DataFrame(jogadores.data)

    if df.empty:
        raise HTTPException(status_code=400, detail="Nenhum jogador apto entre os presentes.")

    df['sexo']       = df['sexo'].str.lower()
    df['corte']      = pd.to_numeric(df['corte'], errors='coerce').fillna(0.0)
    df['nota_final'] = pd.to_numeric(df['nota_final'], errors='coerce').fillna(0.0)

    if len(df) < 12:
        raise HTTPException(status_code=400, detail=f"Apenas {len(df)} jogadores aptos presentes. Mínimo: 12.")

    num_times = 3 if len(df) >= 18 else 2
    opcoes = montar_times(df, num_times)

    resultado = []
    for times in opcoes:
        resultado.append([
            t[['nome', 'sexo', 'nota_final', 'corte', 'convidado']].rename(columns={'nota_final': 'nota'}).to_dict('records')
            for t in times
        ])

    return {"opcoes": resultado}
