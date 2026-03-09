import React, { useState } from 'react';
import { Calendar, Users, AlertCircle, BookOpen, Gift, Shield, Plus, Trash2, X, Bell, ChevronRight, Clock, Search, MessageSquare, UserPlus, Sparkles, BarChart3, Church } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { usePastoral } from '../contexts/PastoralContext';
import { UserRole, AvisoPriority, ViewState } from '../types';

interface DashboardProps {
  setView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
  const { user } = useAuth();
  const { encontros, catequizandos, turmas, catequistas, avisos, addAviso, removeAviso } = useData();
  const { labels } = usePastoral();
  const [isAvisoModalOpen, setIsAvisoModalOpen] = useState(false);
  const [newAviso, setNewAviso] = useState({ titulo: '', conteudo: '', prioridade: AvisoPriority.NORMAL });

  const nextMeeting = encontros.find(e => !e.concluido);
  
  const isCoordenador = user?.role === UserRole.COORDENADOR;
  const totalParticipantes = catequizandos.length;
  const statCard2Value = isCoordenador ? catequistas.length : turmas.length;
  const statCard2Label = isCoordenador ? labels.lideres : labels.turmas;
  
  const atRiskStudents = 1; 

  const currentMonth = new Date().getMonth();
  const birthdays = catequizandos.filter(c => {
    const month = parseInt(c.data_nascimento.split('-')[1]) - 1; 
    return month === currentMonth;
  });

  const handleSaveAviso = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAviso.titulo && newAviso.conteudo) {
      addAviso(newAviso);
      setNewAviso({ titulo: '', conteudo: '', prioridade: AvisoPriority.NORMAL });
      setIsAvisoModalOpen(false);
    }
  };

  const StatCard = ({ title, value, subtext, icon: Icon, colorClass, bgClass, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={22} />
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-1 font-serif">{value}</h3>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {subtext && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{subtext}</p>}
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, label, onClick, colorClass }: any) => (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-church-100 transition-all group cursor-pointer"
    >
      <div className={`p-3 rounded-xl mb-3 ${colorClass} group-hover:scale-110 transition-transform`}>
        <Icon size={20} />
      </div>
      <span className="text-xs font-bold text-gray-700">{label}</span>
    </button>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search & Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={`Buscar ${labels.participantes.toLowerCase()}, ${labels.encontros.toLowerCase()}...`}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-church-500 outline-none transition-all text-sm"
          />
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Sistema Online</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-church-900 via-church-800 to-church-700 text-white shadow-xl shadow-church-200/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-church-500/30 rounded-full blur-2xl"></div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center space-x-2 mb-4">
                <span className="py-1 px-3 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest border border-white/10">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <span className="py-1 px-3 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest border border-white/10">
                  {labels.pastoralNome}
                </span>
                {isCoordenador && (
                  <span className="py-1 px-3 rounded-full bg-amber-400/20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest border border-amber-400/20 text-amber-200 flex items-center">
                    <Shield size={10} className="mr-1" /> Coordenação
                  </span>
                )}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 font-serif italic">Paz e Bem, {user?.name.split(' ')[0]}!</h2>
              <p className="text-church-100 text-base md:text-lg leading-relaxed opacity-90 font-medium">
                "O Senhor é meu pastor e nada me faltará." — Salmo 23
              </p>
            </div>
            
            {/* Liturgical Progress Widget */}
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 w-full md:w-72 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Tempo Litúrgico</span>
                <Sparkles size={14} className="text-amber-300" />
              </div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 border-2 border-white/20 shadow-lg flex items-center justify-center text-white">
                  <Church size={24} />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none">Tempo Comum</p>
                  <p className="text-[10px] font-medium opacity-60 mt-1 uppercase tracking-wider">Cor: Verde</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider opacity-60">
                  <span>Progresso do Ciclo</span>
                  <span>65%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[65%] h-full bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <QuickAction icon={UserPlus} label={labels.novoParticipante} onClick={() => setView(ViewState.PARTICIPANTES)} colorClass="bg-blue-50 text-blue-600" />
        <QuickAction icon={Calendar} label={`Novo ${labels.encontro}`} onClick={() => setView(ViewState.ENCONTROS)} colorClass="bg-purple-50 text-purple-600" />
        <QuickAction icon={MessageSquare} label="Novo Aviso" onClick={() => setIsAvisoModalOpen(true)} colorClass="bg-amber-50 text-amber-600" />
        <QuickAction icon={BookOpen} label="Materiais" onClick={() => setView(ViewState.MATERIAIS)} colorClass="bg-emerald-50 text-emerald-600" />
        <QuickAction icon={BarChart3} label="Relatórios" onClick={() => setView(ViewState.RELATORIOS)} colorClass="bg-pink-50 text-pink-600" />
        <QuickAction icon={Bell} label="Notificações" onClick={() => setView(ViewState.MARKETING)} colorClass="bg-indigo-50 text-indigo-600" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title={`Próximo ${labels.encontro}`}
          value={nextMeeting ? new Date(nextMeeting.data).getDate().toString().padStart(2, '0') + '/' + (new Date(nextMeeting.data).getMonth()+1).toString().padStart(2, '0') : "--/--"} 
          subtext="Agenda Pastoral"
          icon={Calendar} 
          colorClass="text-blue-600"
          bgClass="bg-blue-50" 
          trend={12}
        />
        <StatCard 
          title={labels.participantes}
          value={totalParticipantes} 
          subtext="Frequência Média: 88%"
          icon={Users} 
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          trend={5}
        />
        <StatCard 
          title={statCard2Label} 
          value={statCard2Value} 
          subtext="Equipe Ativa"
          icon={BookOpen} 
          colorClass="text-purple-600"
          bgClass="bg-purple-50"
        />
        <StatCard 
          title="Atenção Pastoral" 
          value={atRiskStudents} 
          subtext="Faltas Críticas"
          icon={AlertCircle} 
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
          trend={-2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Próximos {labels.encontros}</h3>
            <button type="button" onClick={() => setView(ViewState.ENCONTROS)} className="text-sm font-medium text-church-600 hover:text-church-800 transition-colors cursor-pointer">Ver calendário completo</button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {encontros.map((enc) => (
                <div key={enc.id} role="button" tabIndex={0} onClick={() => setView(ViewState.ENCONTROS)} onKeyDown={(e) => e.key === 'Enter' && setView(ViewState.ENCONTROS)} className="p-5 hover:bg-gray-50 transition-colors group cursor-pointer flex items-center justify-between">
                  <div className="flex items-start space-x-5">
                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl shadow-sm border ${
                      enc.concluido ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-white border-church-100 text-church-600'
                    }`}>
                      <span className="text-xs font-bold uppercase">{new Date(enc.data).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                      <span className="text-xl font-bold">{new Date(enc.data).getDate()}</span>
                    </div>
                    <div>
                      <h4 className={`font-bold text-base mb-1 ${enc.concluido ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-900 group-hover:text-church-600 transition-colors'}`}>
                        {enc.tema}
                      </h4>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 font-medium">
                        <span className="flex items-center"><Clock size={12} className="mr-1"/> 09:00 - 10:30</span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          enc.cor_liturgica === 'Verde' || enc.cor_liturgica.includes('Tempo Comum') ? 'bg-green-100 text-green-700' :
                          enc.cor_liturgica.includes('Branco') ? 'bg-yellow-100 text-yellow-700' :
                          enc.cor_liturgica.includes('Roxo') ? 'bg-purple-100 text-purple-700' :
                          enc.cor_liturgica.includes('Vermelho') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {enc.cor_liturgica}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-church-500 transition-colors" />
                </div>
              ))}
              {encontros.length === 0 && (
                <div className="p-10 text-center text-gray-400">
                  <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Nenhum {labels.encontro.toLowerCase()} agendado.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Notices Widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Bell className="mr-2 text-church-600" size={20} />
                Mural de Avisos
              </h3>
              {isCoordenador && (
                <button 
                  onClick={() => setIsAvisoModalOpen(true)}
                  className="w-8 h-8 flex items-center justify-center bg-church-50 text-church-600 rounded-full hover:bg-church-100 transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {avisos.length > 0 ? avisos.map(aviso => {
                let priorityStyles = 'bg-gray-50 border-gray-400';
                let textStyles = 'text-gray-900';
                let subTextStyles = 'text-gray-600';

                if (aviso.prioridade === AvisoPriority.CRITICAL) {
                  priorityStyles = 'bg-red-50 border-red-500';
                  textStyles = 'text-red-900';
                  subTextStyles = 'text-red-800';
                } else if (aviso.prioridade === AvisoPriority.HIGH) {
                  priorityStyles = 'bg-amber-50 border-amber-500';
                  textStyles = 'text-amber-900';
                  subTextStyles = 'text-amber-800';
                } else if (aviso.prioridade === AvisoPriority.NORMAL) {
                  priorityStyles = 'bg-blue-50 border-church-500';
                  textStyles = 'text-blue-900';
                  subTextStyles = 'text-blue-800';
                }

                return (
                  <div 
                    key={aviso.id} 
                    className={`p-4 rounded-xl border-l-4 relative group transition-all hover:-translate-y-1 hover:shadow-md ${priorityStyles}`}
                  >
                    <div className="flex justify-between items-start">
                      <h5 className={`font-bold text-sm mb-1 ${textStyles}`}>{aviso.titulo}</h5>
                      {isCoordenador && (
                        <button 
                          onClick={() => removeAviso(aviso.id)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity absolute top-2 right-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className={`text-xs leading-relaxed ${subTextStyles}`}>{aviso.conteudo}</p>
                  </div>
                );
              }) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400">O mural está vazio.</p>
                </div>
              )}
            </div>
          </div>

          {/* Birthdays Widget */}
          <div className="bg-gradient-to-br from-pink-50 to-white rounded-2xl shadow-sm border border-pink-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Gift className="mr-2 text-pink-500" size={20} />
              Aniversariantes
            </h3>
            {birthdays.length > 0 ? (
              <div className="space-y-3">
                {birthdays.map(student => (
                   <div key={student.id} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-pink-50/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold border border-pink-200">
                          {student.nome_completo.charAt(0)}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{student.nome_completo.split(' ')[0]}</p>
                      </div>
                      <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-1 rounded-md">
                        Dia {student.data_nascimento.split('-')[2]}
                      </span>
                   </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum aniversariante em {new Date().toLocaleDateString('pt-BR', {month: 'long'})}.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Adicionar Aviso */}
      {isAvisoModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all scale-100">
             <div className="bg-church-600 p-5 flex justify-between items-center text-white">
                <h3 className="font-bold text-lg">Novo Aviso</h3>
                <button onClick={() => setIsAvisoModalOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition-colors"><X size={20} /></button>
             </div>
             <form onSubmit={handleSaveAviso} className="p-6 space-y-5">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Título</label>
                   <input 
                      type="text" 
                      required
                      value={newAviso.titulo}
                      onChange={e => setNewAviso({...newAviso, titulo: e.target.value})}
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="Ex: Reunião de Pais"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mensagem</label>
                   <textarea 
                      required
                      value={newAviso.conteudo}
                      onChange={e => setNewAviso({...newAviso, conteudo: e.target.value})}
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-church-500 focus:bg-white outline-none h-28 resize-none text-sm transition-all"
                      placeholder="Digite os detalhes aqui..."
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Prioridade</label>
                   <select 
                      value={newAviso.prioridade}
                      onChange={e => setNewAviso({...newAviso, prioridade: e.target.value as AvisoPriority})}
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-church-500 focus:bg-white outline-none transition-all text-sm font-medium"
                   >
                      {Object.values(AvisoPriority).map(p => (
                         <option key={p} value={p}>{p}</option>
                      ))}
                   </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-church-600 text-white py-3.5 rounded-xl font-bold hover:bg-church-700 transition-all shadow-lg shadow-church-200 transform active:scale-95 cursor-pointer"
                >
                   Publicar Aviso
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
