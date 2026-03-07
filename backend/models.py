from pydantic import BaseModel
from typing import Optional
from enum import Enum


class PastoralType(str, Enum):
    CATEQUESE = "catequese"
    PERSEVERANCA = "perseveranca"
    GRUPO_JOVENS = "grupo_jovens"
    PASTORAL_CRISTA = "pastoral_crista"


class UserRole(str, Enum):
    COORDENADOR = "coordenador"
    LIDER = "lider"
    ADMIN = "admin"


# --- Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    nome: str
    paroquia_id: str
    pastoral_type: PastoralType
    role: UserRole = UserRole.LIDER


# --- Participante (Catequizando/Jovem/Perseverante) ---
class ParticipanteCreate(BaseModel):
    nome_completo: str
    data_nascimento: str
    telefone: Optional[str] = None
    turma_id: str
    pastoral_type: PastoralType
    paroquia_id: str
    sacramentos: Optional[dict] = None
    observacoes: Optional[str] = ""


class ParticipanteUpdate(BaseModel):
    nome_completo: Optional[str] = None
    telefone: Optional[str] = None
    turma_id: Optional[str] = None
    sacramentos: Optional[dict] = None
    observacoes: Optional[str] = None


# --- Lider (Catequista/Animador/Coordenador) ---
class LiderCreate(BaseModel):
    nome: str
    email: str
    telefone: str
    data_nascimento: Optional[str] = None
    turma_id: Optional[str] = None
    pastoral_type: PastoralType
    paroquia_id: str
    tempo_servico_anos: int = 0


# --- Encontro/Reunião ---
class EncontroCreate(BaseModel):
    turma_id: str
    data: str
    tema: str
    cor_liturgica: Optional[str] = "Tempo Comum"
    observacoes: Optional[str] = ""


class EncontroUpdate(BaseModel):
    tema: Optional[str] = None
    data: Optional[str] = None
    cor_liturgica: Optional[str] = None
    observacoes: Optional[str] = None
    concluido: Optional[bool] = None


# --- Presença ---
class PresencaUpsert(BaseModel):
    encontro_id: str
    participante_id: str
    status: str  # P, F, J


# --- Turma/Grupo ---
class TurmaCreate(BaseModel):
    comunidade_id: str
    etapa_nome: str
    ano: int
    faixa_etaria: Optional[str] = ""
    dia_encontro: str
    horario: str
    pastoral_type: PastoralType
