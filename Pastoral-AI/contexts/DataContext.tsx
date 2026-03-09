import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Catequizando,
  Catequista,
  Familia,
  Encontro,
  Presenca,
  Turma,
  Paroquia,
  MaterialApoio,
  Aviso,
} from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { useAuth } from './AuthContext';
import { usePastoral } from './PastoralContext';
import {
  MOCK_CATEQUIZANDOS,
  MOCK_CATEQUISTAS,
  MOCK_FAMILIAS,
  MOCK_ENCONTROS,
  MOCK_PRESENCAS,
  MOCK_TURMAS,
  MOCK_PAROQUIA,
  MOCK_MATERIAIS,
  MOCK_AVISOS
} from '../constants';

interface DataContextType {
  paroquia: Paroquia;
  turmas: Turma[];
  catequizandos: Catequizando[];
  familias: Familia[];
  catequistas: Catequista[];
  encontros: Encontro[];
  presencas: Presenca[];
  materiais: MaterialApoio[];
  avisos: Aviso[];
  loading: boolean;

  addCatequizando: (data: Omit<Catequizando, 'id'>) => Promise<void>;
  addFamilia: (data: Omit<Familia, 'id'>) => void;
  addCatequista: (data: Omit<Catequista, 'id'>) => Promise<void>;
  addEncontro: (data: Omit<Encontro, 'id'>) => Promise<void>;
  updateEncontro: (encontro: Encontro) => Promise<void>;
  updatePresenca: (presenca: Presenca) => Promise<void>;
  addMaterial: (data: Omit<MaterialApoio, 'id' | 'data_adicao'>) => Promise<void>;
  addAviso: (data: Omit<Aviso, 'id' | 'data_publicacao'>) => Promise<void>;
  removeAviso: (id: string) => Promise<void>;
  addTurma: (data: Omit<Turma, 'id'>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ─── Mappers: Supabase row ↔ Frontend type ────────────────────────────────────

function rowToParticipante(row: any): Catequizando {
  const responsaveis = row.responsaveis || [];
  const primary = responsaveis[0] || {};
  return {
    id: row.id,
    turma_id: row.turma_id || '',
    nome_completo: row.nome_completo,
    data_nascimento: row.data_nascimento || '',
    telefone: row.telefone || '',
    nome_responsavel: primary.nome || '',
    telefone_responsavel: primary.telefone || '',
    responsaveis: responsaveis,
    sacramentos: row.sacramentos || { batismo: false, eucaristia: false, crisma: false },
    observacoes_pastorais: row.observacoes || '',
    familia_id: '',
  };
}

function participanteToRow(data: Omit<Catequizando, 'id'>, paroquiaId: string, pastoralType: string) {
  return {
    turma_id: data.turma_id || null,
    paroquia_id: paroquiaId,
    pastoral_type: pastoralType,
    nome_completo: data.nome_completo,
    data_nascimento: data.data_nascimento || null,
    telefone: data.telefone || null,
    sacramentos: data.sacramentos,
    observacoes: data.observacoes_pastorais || '',
    responsaveis: data.responsaveis || [],
  };
}

function rowToLider(row: any): Catequista {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email || '',
    telefone: row.telefone || '',
    data_nascimento: row.data_nascimento || '',
    comunidade_id: '',
    turma_id: row.turma_id || '',
    tempo_servico_anos: row.tempo_servico_anos || 0,
    experiencia_anterior: row.experiencia || '',
    observacoes: row.observacoes || '',
  };
}

function liderToRow(data: Omit<Catequista, 'id'>, paroquiaId: string, pastoralType: string) {
  return {
    paroquia_id: paroquiaId,
    pastoral_type: pastoralType,
    turma_id: data.turma_id || null,
    nome: data.nome,
    email: data.email || null,
    telefone: data.telefone || null,
    data_nascimento: data.data_nascimento || null,
    tempo_servico_anos: data.tempo_servico_anos || 0,
    experiencia: data.experiencia_anterior || '',
    observacoes: data.observacoes || '',
  };
}

function rowToEncontro(row: any): Encontro {
  return {
    id: row.id,
    turma_id: row.turma_id,
    data: row.data,
    tema: row.tema,
    cor_liturgica: row.cor_liturgica || 'Tempo Comum',
    observacoes: row.observacoes || '',
    concluido: row.concluido || false,
  };
}

function rowToPresenca(row: any): Presenca {
  return {
    id: row.id,
    encontro_id: row.encontro_id,
    catequizando_id: row.participante_id,
    status: row.status,
  };
}

function rowToMaterial(row: any): MaterialApoio {
  return {
    id: row.id,
    titulo: row.titulo,
    descricao: row.descricao || '',
    tipo: row.tipo || 'PDF',
    categoria: row.categoria || 'Formação',
    url: row.url || '',
    data_adicao: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  };
}

function rowToAviso(row: any): Aviso {
  return {
    id: row.id,
    titulo: row.titulo,
    conteudo: row.conteudo,
    data_publicacao: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    prioridade: row.prioridade || 'Normal',
  };
}

function rowToTurma(row: any): Turma {
  return {
    id: row.id,
    comunidade_id: row.comunidade_id || '',
    etapa_id: '',
    etapa_nome: row.etapa_nome || '',
    ano: row.ano || new Date().getFullYear(),
    faixa_etaria: row.faixa_etaria || '',
    dia_encontro: row.dia_encontro || '',
    horario: row.horario || '',
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { pastoralType: activePastoralType } = usePastoral();
  const useDb = isSupabaseConfigured();

  const [loading, setLoading] = useState(false);
  const [catequizandos, setCatequizandos] = useState<Catequizando[]>(useDb ? [] : MOCK_CATEQUIZANDOS);
  const [familias, setFamilias] = useState<Familia[]>(useDb ? [] : MOCK_FAMILIAS);
  const [catequistas, setCatequistas] = useState<Catequista[]>(useDb ? [] : MOCK_CATEQUISTAS);
  const [encontros, setEncontros] = useState<Encontro[]>(useDb ? [] : MOCK_ENCONTROS);
  const [presencas, setPresencas] = useState<Presenca[]>(useDb ? [] : MOCK_PRESENCAS);
  const [materiais, setMateriais] = useState<MaterialApoio[]>(useDb ? [] : MOCK_MATERIAIS);
  const [avisos, setAvisos] = useState<Aviso[]>(useDb ? [] : MOCK_AVISOS);
  const [turmas, setTurmas] = useState<Turma[]>(useDb ? [] : MOCK_TURMAS);
  const [paroquia, setParoquia] = useState<Paroquia>(MOCK_PAROQUIA);

  const paroquiaId = user?.parish_id || '';
  const pastoralType = activePastoralType || user?.pastoral_type || 'catequese';

  /** Quando o usuário não tem paróquia (perfil mínimo), usa a primeira paróquia do banco para inserir e carregar participantes/líderes. */
  const getEffectiveParoquiaId = useCallback(async (): Promise<string | null> => {
    if (paroquiaId) return paroquiaId;
    if (!supabase) return null;
    const { data } = await supabase.from('paroquias').select('id').limit(1).maybeSingle();
    return data?.id || null;
  }, [paroquiaId, supabase]);

  // ─── Fetch all data ───────────────────────────────────────────────────────

  const refreshData = useCallback(async () => {
    if (!useDb || !supabase) return;
    setLoading(true);

    const effectiveParoquiaId = paroquiaId || (await getEffectiveParoquiaId()) || '';
    if (!effectiveParoquiaId) {
      try {
        const turmasRes = await supabase.from('turmas').select('*').eq('pastoral_type', pastoralType);
        const turmasData = (turmasRes.data || []).map(rowToTurma);
        setTurmas(turmasData);
        setMateriais((await supabase.from('materiais').select('*').order('created_at', { ascending: false })).data?.map(rowToMaterial) || []);
      } catch (_) {}
      setLoading(false);
      return;
    }

    try {
      const [
        paroquiaRes,
        turmasRes,
        participantesRes,
        lideresRes,
        materiaisRes,
        avisosRes,
      ] = await Promise.all([
        supabase.from('paroquias').select('*').eq('id', effectiveParoquiaId).single(),
        supabase.from('turmas').select('*').eq('pastoral_type', pastoralType),
        supabase.from('participantes').select('*').eq('paroquia_id', effectiveParoquiaId).eq('pastoral_type', pastoralType).order('nome_completo'),
        supabase.from('lideres').select('*').eq('paroquia_id', effectiveParoquiaId).eq('pastoral_type', pastoralType).order('nome'),
        supabase.from('materiais').select('*').order('created_at', { ascending: false }),
        supabase.from('avisos').select('*').eq('paroquia_id', effectiveParoquiaId).order('created_at', { ascending: false }),
      ]);

      if (paroquiaRes.data) {
        setParoquia({
          id: paroquiaRes.data.id,
          diocese_id: paroquiaRes.data.diocese_id || '',
          nome: paroquiaRes.data.nome,
          endereco: paroquiaRes.data.endereco || '',
          telefone: paroquiaRes.data.telefone || '',
        });
      }

      const turmasData = (turmasRes.data || []).map(rowToTurma);
      setTurmas(turmasData);
      setCatequizandos((participantesRes.data || []).map(rowToParticipante));
      setCatequistas((lideresRes.data || []).map(rowToLider));
      setMateriais((materiaisRes.data || []).map(rowToMaterial));
      setAvisos((avisosRes.data || []).map(rowToAviso));

      // Fetch encontros for all turmas
      const turmaIds = turmasData.map(t => t.id);
      if (turmaIds.length > 0) {
        const encontrosRes = await supabase
          .from('encontros')
          .select('*')
          .in('turma_id', turmaIds)
          .order('data', { ascending: false });
        setEncontros((encontrosRes.data || []).map(rowToEncontro));

        const encontroIds = (encontrosRes.data || []).map((e: any) => e.id);
        if (encontroIds.length > 0) {
          const presencasRes = await supabase
            .from('presencas')
            .select('*')
            .in('encontro_id', encontroIds);
          setPresencas((presencasRes.data || []).map(rowToPresenca));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, [useDb, paroquiaId, pastoralType, getEffectiveParoquiaId]);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData, pastoralType]);

  // ─── CRUD: Participantes ──────────────────────────────────────────────────

  const addCatequizando = async (data: Omit<Catequizando, 'id'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setCatequizandos(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    if (!supabase) return;

    const effectiveParoquiaId = await getEffectiveParoquiaId();
    if (!effectiveParoquiaId) {
      const newId = Date.now().toString();
      setCatequizandos(prev => [...prev, { ...data, id: newId }]);
      return;
    }

    const row = participanteToRow(data, effectiveParoquiaId, pastoralType);
    const { data: inserted, error } = await supabase.from('participantes').insert(row).select().single();
    if (error) {
      console.error('Erro ao salvar participante:', error);
      const newId = Date.now().toString();
      setCatequizandos(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    setCatequizandos(prev => [...prev, rowToParticipante(inserted)]);
  };

  // ─── CRUD: Famílias (local only por enquanto) ─────────────────────────────

  const addFamilia = (data: Omit<Familia, 'id'>) => {
    const newId = Date.now().toString();
    setFamilias(prev => [...prev, { ...data, id: newId }]);
  };

  // ─── CRUD: Líderes ────────────────────────────────────────────────────────

  const addCatequista = async (data: Omit<Catequista, 'id'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setCatequistas(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    if (!supabase) return;

    const effectiveParoquiaId = await getEffectiveParoquiaId();
    if (!effectiveParoquiaId) {
      const newId = Date.now().toString();
      setCatequistas(prev => [...prev, { ...data, id: newId }]);
      return;
    }

    const row = liderToRow(data, effectiveParoquiaId, pastoralType);
    const { data: inserted, error } = await supabase.from('lideres').insert(row).select().single();
    if (error) {
      console.error('Erro ao salvar líder:', error);
      const newId = Date.now().toString();
      setCatequistas(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    setCatequistas(prev => [...prev, rowToLider(inserted)]);
  };

  // ─── CRUD: Encontros ──────────────────────────────────────────────────────

  const addEncontro = async (data: Omit<Encontro, 'id'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setEncontros(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    if (!supabase) return;

    const { data: inserted, error } = await supabase.from('encontros').insert({
      turma_id: data.turma_id,
      data: data.data,
      tema: data.tema,
      cor_liturgica: data.cor_liturgica || 'Tempo Comum',
      observacoes: data.observacoes || '',
      concluido: false,
    }).select().single();

    if (error) { console.error(error); return; }
    setEncontros(prev => [...prev, rowToEncontro(inserted)]);
  };

  const updateEncontro = async (encontro: Encontro) => {
    if (!useDb) {
      setEncontros(prev => prev.map(e => e.id === encontro.id ? encontro : e));
      return;
    }
    if (!supabase) return;

    const { error } = await supabase.from('encontros').update({
      tema: encontro.tema,
      data: encontro.data,
      cor_liturgica: encontro.cor_liturgica,
      observacoes: encontro.observacoes,
      concluido: encontro.concluido,
    }).eq('id', encontro.id);

    if (error) { console.error(error); return; }
    setEncontros(prev => prev.map(e => e.id === encontro.id ? encontro : e));
  };

  // ─── CRUD: Presenças ──────────────────────────────────────────────────────

  const updatePresenca = async (presenca: Presenca) => {
    if (!useDb) {
      setPresencas(prev => {
        const idx = prev.findIndex(p => p.id === presenca.id);
        if (idx >= 0) { const n = [...prev]; n[idx] = presenca; return n; }
        return [...prev, presenca];
      });
      return;
    }
    if (!supabase) return;

    // Upsert: check if exists
    const { data: existing } = await supabase
      .from('presencas')
      .select('id')
      .eq('encontro_id', presenca.encontro_id)
      .eq('participante_id', presenca.catequizando_id)
      .maybeSingle();

    if (existing) {
      await supabase.from('presencas').update({ status: presenca.status }).eq('id', existing.id);
      setPresencas(prev => prev.map(p =>
        (p.encontro_id === presenca.encontro_id && p.catequizando_id === presenca.catequizando_id)
          ? { ...p, status: presenca.status }
          : p
      ));
    } else {
      const { data: inserted, error } = await supabase.from('presencas').insert({
        encontro_id: presenca.encontro_id,
        participante_id: presenca.catequizando_id,
        status: presenca.status,
      }).select().single();

      if (error) { console.error(error); return; }
      setPresencas(prev => [...prev, rowToPresenca(inserted)]);
    }
  };

  // ─── CRUD: Materiais ──────────────────────────────────────────────────────

  const addMaterial = async (data: Omit<MaterialApoio, 'id' | 'data_adicao'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setMateriais(prev => [...prev, { ...data, id: newId, data_adicao: new Date().toISOString().split('T')[0] }]);
      return;
    }
    if (!supabase) return;

    const { data: inserted, error } = await supabase.from('materiais').insert({
      paroquia_id: paroquiaId || null,
      titulo: data.titulo,
      descricao: data.descricao,
      tipo: data.tipo,
      categoria: data.categoria,
      url: data.url,
    }).select().single();

    if (error) { console.error(error); return; }
    setMateriais(prev => [rowToMaterial(inserted), ...prev]);
  };

  // ─── CRUD: Avisos ─────────────────────────────────────────────────────────

  const addAviso = async (data: Omit<Aviso, 'id' | 'data_publicacao'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setAvisos(prev => [{ ...data, id: newId, data_publicacao: new Date().toISOString().split('T')[0] }, ...prev]);
      return;
    }
    if (!supabase) return;

    const { data: inserted, error } = await supabase.from('avisos').insert({
      paroquia_id: paroquiaId,
      titulo: data.titulo,
      conteudo: data.conteudo,
      prioridade: data.prioridade || 'Normal',
    }).select().single();

    if (error) { console.error(error); return; }
    setAvisos(prev => [rowToAviso(inserted), ...prev]);
  };

  const removeAviso = async (id: string) => {
    if (!useDb) {
      setAvisos(prev => prev.filter(a => a.id !== id));
      return;
    }
    if (!supabase) return;

    const { error } = await supabase.from('avisos').delete().eq('id', id);
    if (error) { console.error(error); return; }
    setAvisos(prev => prev.filter(a => a.id !== id));
  };

  // ─── CRUD: Turmas ─────────────────────────────────────────────────────────

  const addTurma = async (data: Omit<Turma, 'id'>) => {
    if (!useDb) {
      const newId = Date.now().toString();
      setTurmas(prev => [...prev, { ...data, id: newId }]);
      return;
    }
    if (!supabase) return;

    const { data: inserted, error } = await supabase.from('turmas').insert({
      comunidade_id: data.comunidade_id || null,
      pastoral_type: pastoralType,
      etapa_nome: data.etapa_nome || '',
      ano: data.ano,
      faixa_etaria: data.faixa_etaria || '',
      dia_encontro: data.dia_encontro,
      horario: data.horario,
    }).select().single();

    if (error) { console.error(error); return; }
    setTurmas(prev => [...prev, rowToTurma(inserted)]);
  };

  return (
    <DataContext.Provider value={{
      paroquia,
      turmas,
      catequizandos,
      familias,
      catequistas,
      encontros,
      presencas,
      materiais,
      avisos,
      loading,
      addCatequizando,
      addFamilia,
      addCatequista,
      addEncontro,
      updateEncontro,
      updatePresenca,
      addMaterial,
      addAviso,
      removeAviso,
      addTurma,
      refreshData,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
