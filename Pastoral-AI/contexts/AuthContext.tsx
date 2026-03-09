import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, PastoralType } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { MOCK_USERS } from '../constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: string, pastoralType?: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, nome: string, role?: string, pastoralType?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleMap: Record<string, UserRole> = {
  coordenador: UserRole.COORDENADOR,
  lider: UserRole.LIDER,
  admin: UserRole.ADMIN,
};

function mapProfileToUser(profile: any, email: string): User {
  return {
    id: profile.id,
    name: profile.nome || email.split('@')[0],
    email: email,
    role: roleMap[profile.role] || UserRole.LIDER,
    parish_id: profile.paroquia_id || '',
    paroquia: profile.paroquia_nome || 'Paróquia',
    pastoral_type: (profile.pastoral_type as PastoralType) || PastoralType.CATEQUESE,
    avatar: profile.nome?.charAt(0) || 'U',
  };
}

/** Usuário mínimo quando o perfil ainda não existe na tabela profiles (ex.: logo após cadastro). */
function authUserToMinimalUser(userId: string, email: string): User {
  const name = email.split('@')[0];
  return {
    id: userId,
    name,
    email,
    role: UserRole.LIDER,
    parish_id: '',
    paroquia: 'Paróquia',
    pastoral_type: PastoralType.CATEQUESE,
    avatar: name.charAt(0).toUpperCase() || 'U',
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const useSupabase = isSupabaseConfigured();

  useEffect(() => {
    if (!useSupabase || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          const email = session.user.email || '';
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setUser(mapProfileToUser(profile, email));
          } else {
            setUser(authUserToMinimalUser(session.user.id, email));
          }
        }
      } catch (_) {
        if (session?.user) {
          setUser(authUserToMinimalUser(session.user.id, session.user.email || ''));
        }
      } finally {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          const email = session.user.email || '';
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setUser(mapProfileToUser(profile, email));
          } else {
            setUser(authUserToMinimalUser(session.user.id, email));
          }
        } else {
          setUser(null);
        }
      } catch (_) {
        if (session?.user) {
          setUser(authUserToMinimalUser(session.user.id, session.user.email || ''));
        } else {
          setUser(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    if (!supabase) return null;
    const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
    try {
      const { data } = await Promise.race([
        supabase
          .from('profiles')
          .select('id, nome, email, role, paroquia_id, pastoral_type, paroquias ( nome )')
          .eq('id', userId)
          .maybeSingle()
          .then((r) => r.data),
        timeout(8000),
      ]) as any;
      if (data) {
        return {
          ...data,
          paroquia_nome: data.paroquias?.nome || 'Paróquia',
        };
      }
    } catch (_) {}
    return null;
  }

  const login = async (email: string, password: string, role?: string, pastoralType?: string): Promise<{ success: boolean; error?: string }> => {
    if (!useSupabase) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const foundUser = MOCK_USERS[email];
      if (foundUser) {
        if (role) foundUser.role = roleMap[role] || foundUser.role;
        if (pastoralType) foundUser.pastoral_type = pastoralType as PastoralType;
        setUser(foundUser);
        return { success: true };
      }
      return { success: false, error: 'E-mail não encontrado. Tente "coord@paroquia.com" ou "cat@paroquia.com".' };
    }

    if (!supabase) return { success: false, error: 'Supabase não configurado.' };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message === 'Email not confirmed'
          ? 'Confirme seu e-mail antes de entrar. Verifique a caixa de entrada (e o spam).'
          : error.message;
      return { success: false, error: msg };
    }

    if (data.user) {
      try {
        const profile = await fetchProfile(data.user.id);
        if (profile) {
          const mappedUser = mapProfileToUser(profile, email);
          if (role) mappedUser.role = roleMap[role] || mappedUser.role;
          if (pastoralType) mappedUser.pastoral_type = pastoralType as PastoralType;
          setUser(mappedUser);

          // Atualizar role e pastoral no perfil se diferente
          if (role || pastoralType) {
            const updates: Record<string, string> = {};
            if (role) updates.role = role;
            if (pastoralType) updates.pastoral_type = pastoralType;
            supabase.from('profiles').update(updates).eq('id', data.user.id).then(() => {});
          }
        } else {
          const minUser = authUserToMinimalUser(data.user.id, email);
          if (role) minUser.role = roleMap[role] || minUser.role;
          if (pastoralType) minUser.pastoral_type = pastoralType as PastoralType;
          setUser(minUser);
        }
      } catch (_) {
        const minUser = authUserToMinimalUser(data.user.id, email);
        if (role) minUser.role = roleMap[role] || minUser.role;
        if (pastoralType) minUser.pastoral_type = pastoralType as PastoralType;
        setUser(minUser);
      }
    }

    return { success: true };
  };

  const register = async (email: string, password: string, nome: string, role?: string, pastoralType?: string): Promise<{ success: boolean; error?: string }> => {
    if (!useSupabase) {
      return { success: false, error: 'Supabase não configurado.' };
    }

    if (!supabase) return { success: false, error: 'Supabase não configurado.' };
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        nome,
        email,
        role: role || 'lider',
        pastoral_type: pastoralType || 'catequese',
      });
    }

    return { success: true };
  };

  const logout = async () => {
    if (useSupabase && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
