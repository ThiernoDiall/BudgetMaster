import React, { useState, useMemo } from 'react';
import { useBudget } from '../context/BudgetContext';
import { calculateAmortization, formatMoney } from '../utils/finance';
import { Trash2, Plus, Calculator, History, Filter, CreditCard, Wallet, Repeat, Calendar } from 'lucide-react';
import { MONTHS, Debt } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { useTheme } from '../context/ThemeContext';

export const Debts: React.FC = () => {
  const { debts, addDebt, deleteDebt, budgetRows, categories, isPrivacyMode } = useBudget();
  const { isDark } = useTheme();
  const [form, setForm] = useState<Partial<Debt>>({ 
      name: '', initialBalance: 0, annualRate: 0, monthlyPayment: 0, 
      startDate: new Date().toISOString().split('T')[0], type: 'loan',
      statementDay: 1, dueDay: 21,
      frequency: 'monthly', recurringDay: 1
  });
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [historyMonth, setHistoryMonth] = useState<number | 'all'>('all');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    addDebt(form as Omit<Debt, 'id'>);
    setForm({ 
        name: '', initialBalance: 0, annualRate: 0, monthlyPayment: 0, 
        startDate: new Date().toISOString().split('T')[0], type: 'loan',
        statementDay: 1, dueDay: 21,
        frequency: 'monthly', recurringDay: 1
    });
  };

  const selectedDebt = debts.find(d => d.id === selectedDebtId);
  const amortizationSchedule = useMemo(() => {
    if (!selectedDebt) return [];
    return calculateAmortization(selectedDebt);
  }, [selectedDebt]);

  const paymentHistory = budgetRows.filter(r => {
      if (selectedDebtId) return r.debtId === selectedDebtId;
      const cat = categories.find(c => c.id === r.categoryId);
      return cat?.type === 'Dette';
  }).filter(r => historyMonth === 'all' || r.monthIndex === historyMonth);

  const totalPaidInHistory = paymentHistory.reduce((acc, r) => acc + r.actual, 0);
  
  const totalInitial = debts.reduce((acc, d) => acc + d.initialBalance, 0);
  const totalPaidGlobal = budgetRows.reduce((acc, r) => {
      const cat = categories.find(c => c.id === r.categoryId);
      return cat?.type === 'Dette' ? acc + r.actual : acc;
  }, 0);
  const remainingGlobal = Math.max(0, totalInitial - totalPaidGlobal);

  const chartMetrics = useMemo(() => {
    let initial = 0;
    let paid = 0;

    if (selectedDebt) {
        initial = selectedDebt.initialBalance;
        paid = budgetRows.filter(r => r.debtId === selectedDebt.id).reduce((acc, r) => acc + r.actual, 0);
    } else {
        initial = totalInitial;
        paid = totalPaidGlobal;
    }

    const remaining = Math.max(0, initial - paid);
    const percentage = initial > 0 ? (paid / initial) * 100 : 0;
    
    return { initial, paid, remaining, percentage };
  }, [selectedDebt, debts, budgetRows, totalInitial, totalPaidGlobal]);
  
  const progressData = [
      { name: 'Payé', value: chartMetrics.paid, color: '#10b981' },
      { name: 'Restant', value: chartMetrics.remaining, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white drop-shadow-md">Suivi des Dettes</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Summary Cards - Liquid Glass */}
         <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl border border-white/40 dark:border-white/5">
             <div className="text-sm text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Dettes Totales</div>
             <div className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2 drop-shadow-sm">{formatMoney(totalInitial, isPrivacyMode)}</div>
         </div>
         <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl border border-white/40 dark:border-white/5">
             <div className="text-sm text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Total Remboursé</div>
             <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 drop-shadow-sm">{formatMoney(totalPaidGlobal, isPrivacyMode)}</div>
         </div>
         <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl border border-white/40 dark:border-white/5">
             <div className="text-sm text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Solde Restant</div>
             <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2 drop-shadow-sm">{formatMoney(remainingGlobal, isPrivacyMode)}</div>
         </div>
      </div>

      {/* Add Debt Form - Liquid Glass */}
      <div className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/40 dark:border-white/5">
         <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <Plus size={20} />
            </div>
            Ajouter une dette / carte
         </h3>
         <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Type</label>
                    <div className="relative">
                        <select 
                            className="w-full px-4 py-3 border border-white/30 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/20 outline-none text-sm appearance-none font-medium"
                            value={form.type}
                            onChange={e => setForm({...form, type: e.target.value as any})}
                        >
                            <option value="loan" className="text-slate-900">Prêt (Auto, Étudiant...)</option>
                            <option value="credit_card" className="text-slate-900">Carte de Crédit</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Nom</label>
                    <input 
                    required type="text" 
                    className="w-full px-4 py-3 border border-white/30 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/20 outline-none text-sm"
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    placeholder="Ex: Visa Desjardins"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Solde Actuel</label>
                    <input 
                    required type="number" 
                    className="w-full px-4 py-3 border border-white/30 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/20 outline-none text-sm"
                    value={form.initialBalance} 
                    onChange={e => setForm({...form, initialBalance: parseFloat(e.target.value)})} 
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Taux Intérêt (%)</label>
                    <input 
                    required type="number" step="0.01" 
                    className="w-full px-4 py-3 border border-white/30 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-emerald-500/20 outline-none text-sm"
                    value={form.annualRate} 
                    onChange={e => setForm({...form, annualRate: parseFloat(e.target.value)})} 
                    />
                </div>
            </div>
            
            <div className="bg-white/20 dark:bg-white/5 rounded-2xl p-6 border border-white/30 dark:border-white/5">
               <div className="flex items-center gap-2 mb-4">
                    <Repeat size={18} className="text-emerald-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Configuration du remboursement</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide ml-1">Paiement Mensuel</label>
                        <input 
                        required type="number" 
                        className="w-full px-4 py-3 border border-emerald-500/30 rounded-2xl bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 focus:ring-4 focus:ring-emerald-500/30 outline-none text-sm font-bold"
                        value={form.monthlyPayment} 
                        onChange={e => setForm({...form, monthlyPayment: parseFloat(e.target.value)})} 
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Fréquence</label>
                        <select 
                            className="w-full px-4 py-3 border border-white/30 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-black/30 text-slate-900 dark:text-slate-100 text-sm outline-none"
                            value={form.frequency}
                            onChange={e => setForm({...form, frequency: e.target.value as any})}
                        >
                            <option value="monthly" className="text-slate-900">Mensuel</option>
                            <option value="bimonthly" className="text-slate-900">Bi-mensuel</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                         <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide ml-1">Jour prélèvement</label>
                         <div className="relative">
                            <Calendar size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                            <input 
                                type="number" min="1" max="31"
                                className="w-full px-4 py-3 pl-10 border border-white/30 dark:border-white/10 rounded-2xl bg-white/40 dark:bg-black/30 text-slate-900 dark:text-slate-100 text-sm outline-none"
                                value={form.recurringDay} 
                                onChange={e => setForm({...form, recurringDay: parseInt(e.target.value)})} 
                            />
                         </div>
                    </div>
                    
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 transform hover:scale-[1.02]">
                        <Plus size={20} /> Créer
                    </button>
               </div>
               <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1 opacity-70">
                 * Une catégorie "Dette" sera automatiquement créée.
               </p>
            </div>
         </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Debt List - Liquid Glass */}
          <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 overflow-hidden lg:col-span-1 h-fit">
             <div className="p-5 border-b border-white/20 dark:border-white/5 bg-white/30 dark:bg-white/5 font-bold text-slate-700 dark:text-slate-200">Vos Dettes</div>
             <div className="divide-y divide-white/20 dark:divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
                {debts.map(debt => (
                    <div 
                        key={debt.id} 
                        onClick={() => setSelectedDebtId(debt.id === selectedDebtId ? null : debt.id)}
                        className={`p-5 cursor-pointer hover:bg-white/40 dark:hover:bg-white/10 transition-colors flex justify-between items-center group ${selectedDebtId === debt.id ? 'bg-emerald-500/10 border-l-4 border-emerald-500' : 'border-l-4 border-transparent'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl shadow-sm ${debt.type === 'credit_card' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                {debt.type === 'credit_card' ? <CreditCard size={20} /> : <Wallet size={20} />}
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">{debt.name}</div>
                                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {formatMoney(debt.initialBalance, isPrivacyMode)} <span className="text-xs opacity-70">({debt.annualRate}%)</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteDebt(debt.id); }} className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2 hover:bg-white/50 rounded-xl">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                {debts.length === 0 && <div className="p-8 text-center text-slate-500 font-medium">Aucune dette enregistrée.</div>}
             </div>

             {/* Progress Chart Mini */}
             <div className="p-6 border-t border-white/20 dark:border-white/5 bg-white/20 dark:bg-black/20 backdrop-blur-md">
                 <div className="flex justify-between items-end mb-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase">
                        {selectedDebt ? 'Progression (Sélection)' : 'Progression (Globale)'}
                     </h4>
                     <span className={`text-xs font-bold px-2 py-1 rounded-lg ${chartMetrics.percentage >= 100 ? 'bg-emerald-500 text-white' : 'bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                         {chartMetrics.percentage.toFixed(1)}% Payé
                     </span>
                 </div>

                 <div className="h-48 relative">
                     <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                                data={progressData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {progressData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                formatter={(val: number) => formatMoney(val, isPrivacyMode)} 
                                contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                         </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Restant</span>
                         <span className="text-xl font-extrabold text-slate-700 dark:text-slate-200">
                             {formatMoney(chartMetrics.remaining, isPrivacyMode)}
                         </span>
                     </div>
                 </div>
             </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* Amortization Table - Liquid Glass */}
            {selectedDebt && selectedDebt.type !== 'credit_card' && (
                <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 overflow-hidden flex flex-col h-[450px]">
                    <div className="p-5 border-b border-white/20 dark:border-white/5 bg-white/30 dark:bg-white/5 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Calculator size={20} className="text-indigo-500" />
                        Tableau d'amortissement - {selectedDebt.name}
                    </div>
                    
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/40 dark:bg-black/20 text-slate-500 dark:text-slate-400 sticky top-0 backdrop-blur-md z-10 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Mois</th>
                                    <th className="px-6 py-4">Paiement</th>
                                    <th className="px-6 py-4">Intérêt</th>
                                    <th className="px-6 py-4">Capital</th>
                                    <th className="px-6 py-4">Solde Fin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/20 dark:divide-white/5">
                                {amortizationSchedule.map((row) => (
                                    <tr key={row.monthIndex} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-600 dark:text-slate-400">{row.monthIndex}</td>
                                        <td className="px-6 py-3 font-bold text-slate-800 dark:text-slate-200">{formatMoney(row.totalPayment, isPrivacyMode)}</td>
                                        <td className="px-6 py-3 font-medium text-rose-500">{formatMoney(row.interestPaid, isPrivacyMode)}</td>
                                        <td className="px-6 py-3 font-medium text-emerald-600 dark:text-emerald-400">{formatMoney(row.principalPaid, isPrivacyMode)}</td>
                                        <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{formatMoney(row.remainingBalance, isPrivacyMode)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payment History - Liquid Glass */}
            <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 overflow-hidden h-[400px] flex flex-col">
                <div className="p-5 border-b border-white/20 dark:border-white/5 bg-white/30 dark:bg-white/5 flex justify-between items-center">
                    <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                         <History size={20} className="text-blue-500" /> 
                         Historique Réel {selectedDebt ? `(${selectedDebt.name})` : '(Global)'}
                    </div>
                    {/* Filter */}
                    <div className="flex items-center space-x-2 bg-white/40 dark:bg-black/20 rounded-lg px-2 py-1 border border-white/20">
                        <Filter size={14} className="text-slate-500" />
                        <select 
                            className="bg-transparent border-none text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer"
                            value={historyMonth}
                            onChange={(e) => setHistoryMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                        >
                            <option value="all" className="text-slate-900">Tout l'historique</option>
                            {MONTHS.map((m, i) => <option key={i} value={i} className="text-slate-900">{m}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="overflow-auto flex-1 custom-scrollbar">
                     <table className="w-full text-sm text-left">
                         <thead className="bg-white/40 dark:bg-black/20 text-slate-500 dark:text-slate-400 sticky top-0 backdrop-blur-md z-10 text-xs uppercase font-bold tracking-wider">
                             <tr>
                                 <th className="px-6 py-4">Mois</th>
                                 <th className="px-6 py-4">Description</th>
                                 <th className="px-6 py-4 text-right">Montant Payé</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/20 dark:divide-white/5">
                             {paymentHistory.map((row) => (
                                 <tr key={row.id} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                                     <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{MONTHS[row.monthIndex]} {row.year}</td>
                                     <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">{row.description || '-'}</td>
                                     <td className="px-6 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(row.actual, isPrivacyMode)}</td>
                                 </tr>
                             ))}
                             {paymentHistory.length > 0 && (
                                 <tr className="bg-emerald-500/10 font-bold">
                                     <td className="px-6 py-4 text-emerald-800 dark:text-emerald-300">Total</td>
                                     <td className="px-6 py-4"></td>
                                     <td className="px-6 py-4 text-right text-emerald-700 dark:text-emerald-300">{formatMoney(totalPaidInHistory, isPrivacyMode)}</td>
                                 </tr>
                             )}
                             {paymentHistory.length === 0 && (
                                 <tr>
                                     <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">Aucun paiement enregistré.</td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};