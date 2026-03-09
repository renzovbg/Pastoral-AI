import React, { useState } from 'react';
import { Church, Lock, Mail, Loader2, Info, BookOpen, HeartHandshake, Users, ChevronRight, Sparkles, UserPlus, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePastoral } from '../contexts/PastoralContext';
import { PastoralType, UserRole } from '../types';
import { PASTORAL_CONFIGS } from '../constants';
import { isSupabaseConfigured } from '../services/supabaseClient';

const PASTORAL_ICONS: Record<PastoralType, React.ReactNode> = {
  [PastoralType.CATEQUESE]: <BookOpen size={28} />,
  [PastoralType.PERSEVERANCA]: <HeartHandshake size={28} />,
  [PastoralType.GRUPO_JOVENS]: <Users size={28} />,
  [PastoralType.PASTORAL_CRISTA]: <Church size={28} />,
};

const PASTORAL_COLORS: Record<PastoralType, { bg: string; border: string; text: string; ring: string; iconBg: string }> = {
  [PastoralType.CATEQUESE]: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ring: 'ring-blue-500', iconBg: 'bg-blue-100 text-blue-600' },
  [PastoralType.PERSEVERANCA]: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', ring: 'ring-emerald-500', iconBg: 'bg-emerald-100 text-emerald-600' },
  [PastoralType.GRUPO_JOVENS]: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', ring: 'ring-purple-500', iconBg: 'bg-purple-100 text-purple-600' },
  [PastoralType.PASTORAL_CRISTA]: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', ring: 'ring-amber-500', iconBg: 'bg-amber-100 text-amber-600' },
};

const Login: React.FC = () => {
  const { login, register } = useAuth();
  const { setPastoralType } = usePastoral();
  const hasSupabase = isSupabaseConfigured();

  const [step, setStep] = useState<'pastoral' | 'credentials'>('pastoral');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedPastoral, setSelectedPastoral] = useState<PastoralType | null>(null);
  const [selectedRole, setSelectedRole] = useState<'coordenador' | 'lider'>('lider');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleContinue = () => {
    if (selectedPastoral) {
      setPastoralType(selectedPastoral);
      setStep('credentials');
    }
  };

  const getRoleLabel = () => {
    if (!selectedPastoral) return { coordLabel: 'Coordenador', liderLabel: 'Líder' };
    const cfg = PASTORAL_CONFIGS[selectedPastoral].labels;
    return { coordLabel: cfg.coordenador, liderLabel: cfg.lider };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const pastoralValue = selectedPastoral || PastoralType.CATEQUESE;

    if (mode === 'register') {
      if (!nome.trim()) {
        setError('Preencha o nome completo.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        setLoading(false);
        return;
      }
      const result = await register(email, password, nome, selectedRole, pastoralValue);
      if (!result.success) {
        setError(result.error || 'Erro ao registrar.');
      } else {
        setSuccess('Conta criada! Verifique seu e-mail para confirmar, depois faça login.');
        setMode('login');
        setNome('');
        setPassword('');
      }
    } else {
      const result = await login(email, password, selectedRole, pastoralValue);
      if (!result.success) {
        setError(result.error || 'Erro ao fazer login.');
      }
    }

    setLoading(false);
  };

  const { coordLabel, liderLabel } = getRoleLabel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-church-600 to-church-800 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg shadow-church-200">
            <Church size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Vinculum</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">Gestão Pastoral Inteligente</p>
        </div>

        {step === 'pastoral' ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center space-x-2 mb-6">
                <Sparkles size={18} className="text-church-600" />
                <h2 className="text-lg font-bold text-gray-900">Selecione sua Pastoral</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">O sistema se adaptará automaticamente à terminologia e funcionalidades da pastoral escolhida.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(PastoralType).map((type) => {
                  const config = PASTORAL_CONFIGS[type];
                  const colors = PASTORAL_COLORS[type];
                  const isSelected = selectedPastoral === type;

                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedPastoral(type)}
                      className={`relative p-5 rounded-xl border-2 transition-all duration-200 text-left group cursor-pointer
                        ${isSelected
                          ? `${colors.bg} ${colors.border} ring-2 ${colors.ring} shadow-md scale-[1.02]`
                          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white'
                        }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors
                        ${isSelected ? colors.iconBg : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                        {PASTORAL_ICONS[type]}
                      </div>
                      <h3 className={`font-bold text-sm mb-1 ${isSelected ? colors.text : 'text-gray-800'}`}>
                        {config.labels.pastoralNome}
                      </h3>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        {config.labels.participantes}, {config.labels.lideres}, {config.labels.encontros}
                      </p>
                      {isSelected && (
                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center ${colors.iconBg}`}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 1 3.5 6.5 1 4" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleContinue}
                disabled={!selectedPastoral}
                className="w-full mt-6 bg-church-600 text-white py-3.5 rounded-xl font-bold hover:bg-church-700 transition-all shadow-lg shadow-church-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-[0.98] cursor-pointer"
              >
                Continuar <ChevronRight size={18} className="ml-1" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {selectedPastoral && (
              <div className={`${PASTORAL_COLORS[selectedPastoral].bg} px-8 py-4 border-b ${PASTORAL_COLORS[selectedPastoral].border} flex items-center justify-between`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${PASTORAL_COLORS[selectedPastoral].iconBg}`}>
                    {React.cloneElement(PASTORAL_ICONS[selectedPastoral] as React.ReactElement, { size: 16 })}
                  </div>
                  <span className={`font-bold text-sm ${PASTORAL_COLORS[selectedPastoral].text}`}>
                    {PASTORAL_CONFIGS[selectedPastoral].labels.pastoralNome}
                  </span>
                </div>
                <button
                  onClick={() => setStep('pastoral')}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 underline cursor-pointer"
                >
                  Alterar
                </button>
              </div>
            )}

            <div className="p-8">
              {/* Tab Login / Registrar */}
              {hasSupabase && (
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                  <button
                    onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${mode === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <UserPlus size={14} /> Criar Conta
                  </button>
                </div>
              )}

              {/* Role Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Entrar como</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('coordenador')}
                    className={`p-3.5 rounded-xl border-2 transition-all text-left cursor-pointer flex items-center gap-3
                      ${selectedRole === 'coordenador'
                        ? 'border-church-500 bg-church-50 ring-1 ring-church-500'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedRole === 'coordenador' ? 'bg-church-100 text-church-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${selectedRole === 'coordenador' ? 'text-church-700' : 'text-gray-700'}`}>{coordLabel}</p>
                      <p className="text-[10px] text-gray-500">Gestão completa</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('lider')}
                    className={`p-3.5 rounded-xl border-2 transition-all text-left cursor-pointer flex items-center gap-3
                      ${selectedRole === 'lider'
                        ? 'border-church-500 bg-church-50 ring-1 ring-church-500'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedRole === 'lider' ? 'bg-church-100 text-church-600' : 'bg-gray-100 text-gray-400'}`}>
                      <User size={20} />
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${selectedRole === 'lider' ? 'text-church-700' : 'text-gray-700'}`}>{liderLabel}</p>
                      <p className="text-[10px] text-gray-500">Minha {selectedPastoral ? PASTORAL_CONFIGS[selectedPastoral].labels.turma.toLowerCase() : 'turma'}</p>
                    </div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-church-500 focus:border-transparent outline-none transition-all"
                      placeholder="Seu nome completo"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-church-500 focus:border-transparent outline-none transition-all"
                      placeholder="seu.nome@paroquia.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      required={hasSupabase}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-church-500 focus:border-transparent outline-none transition-all"
                      placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                    />
                  </div>
                  {mode === 'login' && (
                    <p className="text-xs text-right mt-1 text-church-600 hover:underline cursor-pointer">Esqueceu sua senha?</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-start">
                    <Info size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm flex items-start">
                    <Info size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-church-600 text-white py-3.5 rounded-xl font-bold hover:bg-church-700 transition-all shadow-lg shadow-church-200 flex items-center justify-center disabled:opacity-70 transform active:scale-[0.98] cursor-pointer"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : mode === 'register' ? 'Criar Conta' : 'Acessar Sistema'}
                </button>
              </form>

              {/* Mock credentials */}
              {!hasSupabase && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                    <p className="text-xs text-amber-800 font-medium">Supabase não configurado. Usando dados de demonstração (mock).</p>
                  </div>
                  <p className="text-xs text-center text-gray-500 mb-2">Credenciais de Teste:</p>
                  <div className="flex flex-col space-y-2 text-xs">
                    <button onClick={() => { setEmail('coord@paroquia.com'); setSelectedRole('coordenador'); }} className="bg-gray-50 p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 text-left border border-gray-200 transition-colors cursor-pointer">
                      <strong>Coordenador:</strong> coord@paroquia.com
                    </button>
                    <button onClick={() => { setEmail('cat@paroquia.com'); setSelectedRole('lider'); }} className="bg-gray-50 p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 text-left border border-gray-200 transition-colors cursor-pointer">
                      <strong>{liderLabel}:</strong> cat@paroquia.com
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
