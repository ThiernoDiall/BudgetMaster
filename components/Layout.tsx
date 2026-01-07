import React from 'react';
import { LayoutDashboard, List, DollarSign, TrendingUp, CreditCard, FileSpreadsheet, Menu, X, Sun, Moon, Eye, EyeOff, UploadCloud } from 'lucide-react';
import { MONTHS } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useBudget } from '../context/BudgetContext';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, setIsOpen }) => {
  const { isDark, toggleTheme } = useTheme();
  const { currentYear, setYear, isPrivacyMode, togglePrivacy } = useBudget();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Annuel', icon: LayoutDashboard },
    { id: 'import', label: 'Importation', icon: UploadCloud },
    { id: 'categories', label: 'Catégories', icon: List },
    { id: 'revenues', label: 'Revenus', icon: DollarSign },
    { id: 'debts', label: 'Dettes & Amort.', icon: CreditCard },
    { id: 'investments', label: 'Investissements', icon: TrendingUp },
  ];

  const years = Array.from({ length: 10 }, (_, i) => 2023 + i);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/40 lg:hidden backdrop-blur-md transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar - Liquid Glass */}
      <aside className={`
        fixed inset-y-4 left-4 z-30 w-64 rounded-3xl
        bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10
        text-slate-100 shadow-2xl transform transition-transform duration-500 ease-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'} lg:translate-x-0 lg:static lg:h-[calc(100vh-2rem)] lg:my-4 lg:ml-4
      `}>
        <div className="flex h-24 items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
             <Logo className="w-10 h-10 drop-shadow-lg" />
             <span className="font-brand text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 drop-shadow-sm leading-none">
               BudgetMaster <br/><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Pro</span>
             </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-500 dark:text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Global Controls */}
        <div className="px-4 pb-6 space-y-3">
           <div className="flex items-center justify-between bg-white/30 dark:bg-black/30 rounded-2xl p-2 border border-white/20 dark:border-white/5 shadow-inner backdrop-blur-sm">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase pl-2">Année</span>
              <select 
                value={currentYear}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-transparent text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-lg border-none focus:ring-0 py-1 px-2 cursor-pointer"
              >
                {years.map(y => <option key={y} value={y} className="text-slate-900 bg-white">{y}</option>)}
              </select>
           </div>
           
           <button 
             onClick={togglePrivacy}
             className={`flex items-center justify-between w-full px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border shadow-sm ${
               isPrivacyMode 
               ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 shadow-indigo-500/10' 
               : 'bg-white/20 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-white/30 dark:border-white/10 hover:bg-white/40'
             }`}
           >
             <div className="flex items-center space-x-2">
                {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                <span>Discrétion</span>
             </div>
             <div className={`w-8 h-4 rounded-full relative transition-colors ${isPrivacyMode ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isPrivacyMode ? 'left-4.5' : 'left-0.5'}`}></div>
             </div>
           </button>
        </div>

        <nav className="flex-1 flex flex-col overflow-y-auto px-4 space-y-1 custom-scrollbar">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2 mt-2">Général</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onChangeView(item.id); setIsOpen(false); }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all w-full group relative overflow-hidden ${
                  active 
                  ? 'bg-white/60 dark:bg-white/10 text-emerald-700 dark:text-emerald-300 shadow-lg shadow-emerald-500/10 border border-white/40 dark:border-white/10' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-white/5'
                }`}
              >
                {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}
                <Icon size={20} className={active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="mt-8 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2">Mensuel</div>
          {MONTHS.map((month, idx) => {
             const active = currentView === `month-${idx}`;
             return (
                <button
                key={month}
                onClick={() => { onChangeView(`month-${idx}`); setIsOpen(false); }}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all w-full relative overflow-hidden ${
                    active
                    ? 'bg-white/50 dark:bg-white/10 text-emerald-700 dark:text-emerald-300 border border-white/40 dark:border-white/10 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/30 dark:hover:bg-white/5'
                }`}
                >
                {active && <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-500"></div>}
                <FileSpreadsheet size={16} className={active ? 'text-emerald-500' : 'text-slate-400'} />
                <span>{month}</span>
                </button>
            );
          })}
        </nav>

        {/* Footer with Theme Toggle */}
        <div className="p-4 shrink-0">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center space-x-3 px-4 py-3 w-full rounded-2xl text-sm font-semibold bg-gradient-to-br from-white/40 to-white/20 dark:from-white/10 dark:to-white/5 border border-white/30 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:scale-[1.02] transition-transform shadow-lg"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-500" />}
            <span>{isDark ? 'Mode Lumière' : 'Mode Sombre'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export const Layout: React.FC<{ children: React.ReactNode; currentView: string; onChangeView: (v: string) => void }> = ({ children, currentView, onChangeView }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar currentView={currentView} onChangeView={onChangeView} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <header className="flex items-center justify-between px-6 py-4 lg:hidden z-10">
            <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-xl border border-white/30 text-slate-700 dark:text-slate-200 shadow-lg">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-8 drop-shadow-md" />
              <span className="font-brand font-bold tracking-tight text-lg text-slate-800 dark:text-white drop-shadow-md">BudgetMaster Pro</span>
            </div>
            <div className="w-10" /> 
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};