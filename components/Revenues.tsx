import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { MONTHS } from '../types';
import { formatCurrency, formatMoney } from '../utils/finance';
import { Trash2, Plus, Calendar, Filter, Wallet } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Revenues: React.FC = () => {
  const { revenues, categories, addRevenue, deleteRevenue, currentYear, isPrivacyMode } = useBudget();
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [newRevenue, setNewRevenue] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    description: '', 
    source: '', 
    amount: 0, 
    categoryId: '' 
  });
  const { isDark } = useTheme();

  const revenueCategories = categories.filter(c => c.type === 'Revenu');

  const filteredRevenues = revenues
    .filter(r => r.year === currentYear)
    .filter(r => selectedMonth === 'all' || r.monthIndex === selectedMonth)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFiltered = filteredRevenues.reduce((acc, r) => acc + r.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevenue.categoryId || !newRevenue.description) return;
    const dateObj = new Date(newRevenue.date);
    addRevenue({ ...newRevenue, monthIndex: dateObj.getMonth(), year: dateObj.getFullYear() });
    setNewRevenue({ 
        date: new Date().toISOString().split('T')[0], description: '', source: '', amount: 0, categoryId: '' 
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white drop-shadow-md">Journal des Revenus</h2>
        
        {/* Month Filter */}
        <div className="flex items-center space-x-2 bg-white/40 dark:bg-black/30 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/30 dark:border-white/10 shadow-lg">
            <Filter size={16} className="text-slate-500" />
            <select 
                className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            >
                <option value="all" className="text-slate-900">Année complète</option>
                {MONTHS.map((m, i) => <option key={i} value={i} className="text-slate-900">{m}</option>)}
            </select>
        </div>
      </div>

      {/* Stats Card - Liquid Glass */}
      <div className="bg-emerald-500/20 dark:bg-emerald-900/40 backdrop-blur-2xl border border-emerald-500/30 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={100} />
          </div>
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Total Revenus ({selectedMonth === 'all' ? currentYear : MONTHS[selectedMonth]})</p>
          <p className="text-4xl font-extrabold text-emerald-700 dark:text-emerald-200 mt-2 drop-shadow-sm">{formatMoney(totalFiltered, isPrivacyMode)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Form - Liquid Glass */}
        <div className="lg:col-span-1 bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 h-fit">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                <span className="bg-emerald-500 rounded-lg p-1 text-white"><Plus size={16} /></span>
                Nouveau revenu
            </h3>
            <form onSubmit={handleAdd} className="space-y-5">
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Date</label>
                    <input 
                        type="date" required
                        className="w-full px-4 py-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all"
                        value={newRevenue.date}
                        onChange={e => setNewRevenue({...newRevenue, date: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Catégorie</label>
                    <div className="relative">
                        <select 
                            required
                            className="w-full px-4 py-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/20 outline-none text-sm font-medium appearance-none"
                            value={newRevenue.categoryId}
                            onChange={e => setNewRevenue({...newRevenue, categoryId: e.target.value})}
                        >
                            <option value="">Sélectionner...</option>
                            {revenueCategories.map(c => <option key={c.id} value={c.id} className="text-slate-900">{c.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Description</label>
                    <input 
                        type="text" required
                        className="w-full px-4 py-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all placeholder-slate-400"
                        placeholder="Ex: Salaire de base"
                        value={newRevenue.description}
                        onChange={e => setNewRevenue({...newRevenue, description: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Source (Optionnel)</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/20 outline-none text-sm font-medium transition-all placeholder-slate-400"
                        placeholder="Ex: Employeur Inc."
                        value={newRevenue.source}
                        onChange={e => setNewRevenue({...newRevenue, source: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Montant</label>
                    <input 
                        type="number" required step="0.01"
                        className="w-full px-4 py-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/20 outline-none text-sm font-bold transition-all"
                        value={newRevenue.amount}
                        onChange={e => setNewRevenue({...newRevenue, amount: parseFloat(e.target.value)})}
                    />
                </div>
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transform hover:scale-[1.02]">
                    <Plus size={18} /> Ajouter
                </button>
            </form>
        </div>

        {/* List - Liquid Glass */}
        <div className="lg:col-span-2 bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/20 dark:border-white/5 bg-white/30 dark:bg-white/5 font-bold text-slate-700 dark:text-slate-200">
                Historique des transactions
            </div>
            <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/40 dark:bg-black/20 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4">Catégorie</th>
                            <th className="px-6 py-4 text-right">Montant</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20 dark:divide-white/5">
                        {filteredRevenues.map(rev => {
                            const cat = categories.find(c => c.id === rev.categoryId);
                            return (
                                <tr key={rev.id} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{rev.date}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 dark:text-slate-200">{rev.description}</div>
                                        {rev.source && <div className="text-xs text-slate-500 opacity-80 mt-0.5">{rev.source}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
                                            {cat?.name || 'Inconnu'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                                        +{formatMoney(rev.amount, isPrivacyMode)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => deleteRevenue(rev.id)} className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2 hover:bg-white/50 rounded-xl">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredRevenues.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">Aucun revenu pour cette période.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};