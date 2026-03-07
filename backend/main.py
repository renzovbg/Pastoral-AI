from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from config import get_supabase
from models import (
    LoginRequest, RegisterRequest,
    ParticipanteCreate, ParticipanteUpdate,
    LiderCreate,
    EncontroCreate, EncontroUpdate,
    PresencaUpsert,
    TurmaCreate,
)

app = FastAPI(
    title="Vinculum API",
    description="Backend para gestão pastoral multi-tipo (Catequese, Perseverança, Grupo de Jovens, Pastoral Cristã)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = get_supabase()


# ─── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "vinculum-api"}


# ─── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    try:
        auth_res = supabase.auth.sign_up({"email": req.email, "password": req.password})

        if auth_res.user:
            supabase.table("profiles").insert({
                "id": auth_res.user.id,
                "nome": req.nome,
                "email": req.email,
                "paroquia_id": req.paroquia_id,
                "pastoral_type": req.pastoral_type.value,
                "role": req.role.value,
            }).execute()

        return {"user_id": auth_res.user.id if auth_res.user else None, "message": "Registrado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/login")
def login(req: LoginRequest):
    try:
        res = supabase.auth.sign_in_with_password({"email": req.email, "password": req.password})
        profile = supabase.table("profiles").select("*").eq("id", res.user.id).single().execute()

        return {
            "access_token": res.session.access_token,
            "user": profile.data,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")


# ─── Participantes (Catequizandos / Jovens / Perseverantes) ───────────────────

@app.get("/api/participantes")
def list_participantes(paroquia_id: str, pastoral_type: str = None):
    query = supabase.table("participantes").select("*").eq("paroquia_id", paroquia_id)
    if pastoral_type:
        query = query.eq("pastoral_type", pastoral_type)
    res = query.order("nome_completo").execute()
    return res.data


@app.post("/api/participantes")
def create_participante(data: ParticipanteCreate):
    res = supabase.table("participantes").insert(data.model_dump()).execute()
    return res.data[0] if res.data else {}


@app.patch("/api/participantes/{id}")
def update_participante(id: str, data: ParticipanteUpdate):
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    res = supabase.table("participantes").update(payload).eq("id", id).execute()
    return res.data[0] if res.data else {}


@app.delete("/api/participantes/{id}")
def delete_participante(id: str):
    supabase.table("participantes").delete().eq("id", id).execute()
    return {"deleted": True}


# ─── Líderes (Catequistas / Animadores / Coordenadores) ──────────────────────

@app.get("/api/lideres")
def list_lideres(paroquia_id: str, pastoral_type: str = None):
    query = supabase.table("lideres").select("*").eq("paroquia_id", paroquia_id)
    if pastoral_type:
        query = query.eq("pastoral_type", pastoral_type)
    res = query.order("nome").execute()
    return res.data


@app.post("/api/lideres")
def create_lider(data: LiderCreate):
    res = supabase.table("lideres").insert(data.model_dump()).execute()
    return res.data[0] if res.data else {}


@app.delete("/api/lideres/{id}")
def delete_lider(id: str):
    supabase.table("lideres").delete().eq("id", id).execute()
    return {"deleted": True}


# ─── Encontros / Reuniões ─────────────────────────────────────────────────────

@app.get("/api/encontros")
def list_encontros(turma_id: str):
    res = supabase.table("encontros").select("*").eq("turma_id", turma_id).order("data", desc=True).execute()
    return res.data


@app.post("/api/encontros")
def create_encontro(data: EncontroCreate):
    res = supabase.table("encontros").insert(data.model_dump()).execute()
    return res.data[0] if res.data else {}


@app.patch("/api/encontros/{id}")
def update_encontro(id: str, data: EncontroUpdate):
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    res = supabase.table("encontros").update(payload).eq("id", id).execute()
    return res.data[0] if res.data else {}


# ─── Presenças ────────────────────────────────────────────────────────────────

@app.get("/api/presencas")
def list_presencas(encontro_id: str):
    res = supabase.table("presencas").select("*").eq("encontro_id", encontro_id).execute()
    return res.data


@app.post("/api/presencas")
def upsert_presenca(data: PresencaUpsert):
    existing = (
        supabase.table("presencas")
        .select("id")
        .eq("encontro_id", data.encontro_id)
        .eq("participante_id", data.participante_id)
        .execute()
    )

    if existing.data:
        res = supabase.table("presencas").update({"status": data.status}).eq("id", existing.data[0]["id"]).execute()
    else:
        res = supabase.table("presencas").insert(data.model_dump()).execute()

    return res.data[0] if res.data else {}


# ─── Turmas / Grupos ──────────────────────────────────────────────────────────

@app.get("/api/turmas")
def list_turmas(paroquia_id: str = None, pastoral_type: str = None):
    query = supabase.table("turmas").select("*")
    if paroquia_id:
        query = query.eq("comunidade_id", paroquia_id)
    if pastoral_type:
        query = query.eq("pastoral_type", pastoral_type)
    res = query.execute()
    return res.data


@app.post("/api/turmas")
def create_turma(data: TurmaCreate):
    res = supabase.table("turmas").insert(data.model_dump()).execute()
    return res.data[0] if res.data else {}


# ─── Materiais ────────────────────────────────────────────────────────────────

@app.get("/api/materiais")
def list_materiais(paroquia_id: str = None):
    query = supabase.table("materiais").select("*")
    if paroquia_id:
        query = query.eq("paroquia_id", paroquia_id)
    res = query.order("created_at", desc=True).execute()
    return res.data


# ─── Avisos ───────────────────────────────────────────────────────────────────

@app.get("/api/avisos")
def list_avisos(paroquia_id: str):
    res = (
        supabase.table("avisos")
        .select("*")
        .eq("paroquia_id", paroquia_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
