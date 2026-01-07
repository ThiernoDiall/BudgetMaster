import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { MONTHS } from '../types';
import { formatCurrency, formatMoney } from '../utils/finance';
import { Plus, Trash2, PieChart as PieIcon, Repeat, ArrowRight, Save, X } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface MonthlySheetProps {
  monthIndex: number;
}

const COLORS = ['#f472b6', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#e879f9', '#34d399', '#818cf8'];

const getColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

const CustomPieTooltip = ({ active, payload, total }: { active?: boolean, payload?: any[], total: number }) => {
  const { isDark } = useTheme();
  const { isPrivacyMode } = useBudget();
  
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
    
    return (
      <div className={`px-3 py-2 rounded-xl shadow-lg border backdrop-blur-xl ${isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-white/40'}`}>
        <p className="font-bold text-xs mb-1" style={{ color: payload[0].fill }}>
          {data.name}
        </p>
        <div className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          <span>{formatMoney(data.value, isPrivacyMode)}</span>
          <span className="ml-2 opacity-60">({percent}%)</span>
        </div>
      </div>
    );
  }
  return null;
};

export const MonthlySheet: React.FC<MonthlySheetProps> = ({ monthIndex }) => {
  const { categories, budgetRows, addBudgetRow, deleteBudgetRow, updateBudgetRow, debts, currentYear, isPrivacyMode } = useBudget();
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState<{categoryId: string, description: string, planned: number, actual: number, debtId?: string}>({ categoryId: '', description: '', planned: 0, actual: 0, debtId: '' });
  const { isDark } = useTheme();

  const currentRows = budgetRows.filter(r => r.monthIndex === monthIndex && r.year === currentYear);
  const getCategoryDetails = (id: string) => categories.find(c => c.id === id);

  const handleAdd = () => {
    if (!newRow.categoryId) return;
    addBudgetRow({ ...newRow, monthIndex, year: currentYear });
    setNewRow({ categoryId: '', description: '', planned: 0, actual: 0, debtId: '' });
    setIsAdding(false);
  };

  const totalRevenus = currentRows.reduce((sum, r) => getCategoryDetails(r.categoryId)?.type === 'Revenu' ? sum + r.actual : sum, 0);
  const totalDepenses = currentRows.reduce((sum, r) => getCategoryDetails(r.categoryId)?.type === 'Dépense' ? sum + r.actual : sum, 0);
  const totalEpargne = currentRows.reduce((sum, r) => getCategoryDetails(r.categoryId)?.type === 'Épargne' ? sum + r.actual : sum, 0);
  const cashflow = totalRevenus - totalDepenses - totalEpargne;

  const relevantTypes = ['Dépense', 'Dette', 'Épargne', 'Investissement'];
  const chartData = categories
    .filter(c => relevantTypes.includes(c.type))
    .map(c => {
        const value = currentRows
          .filter(r => r.categoryId === c.id)
          .reduce((sum, r) => sum + r.actual, 0);
        return { name: c.name, value, type: c.type };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalDistributed = chartData.reduce((acc, cur) => acc + cur.value, 0);
  const pieChartKey = JSON.stringify(chartData.map(d => d.value));
  const getNewRowCatDetails = () => categories.find(c => c.id === newRow.categoryId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 drop-shadow-sm font-brand">{MONTHS[monthIndex]} {currentYear}</h2>
         <div className="flex flex-wrap gap-4 text-sm font-bold">
             <div className="bg-emerald-500/10 dark:bg-emerald-900/40 px-4 py-2 rounded-2xl backdrop-blur-md text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-lg">
                Revenus: {formatMoney(totalRevenus, isPrivacyMode)}
             </div>
             <div className="bg-rose-500/10 dark:bg-rose-900/40 px-4 py-2 rounded-2xl backdrop-blur-md text-rose-700 dark:text-rose-400 border border-rose-500/20 shadow-lg">
                Dépenses: {formatMoney(totalDepenses, isPrivacyMode)}
             </div>
             <div className="bg-blue-500/10 dark:bg-blue-900/40 px-4 py-2 rounded-2xl backdrop-blur-md text-blue-700 dark:text-blue-400 border border-blue-500/20 shadow-lg">
                Cashflow: {formatMoney(cashflow, isPrivacyMode)}
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Section - Liquid Glass */}
        <div className="lg:col-span-2 bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 overflow-hidden min-h-[500px] flex flex-col">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/40 dark:bg-black/20 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs border-b border-white/20">
                <tr>
                  <th className="px-5 py-4">Catégorie</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4 text-right">Prévu</th>
                  <th className="px-5 py-4 text-right">Réel</th>
                  <th className="px-5 py-4 text-right">Écart</th>
                  <th className="px-5 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20 dark:divide-white/5">
                {currentRows.map(row => {
                  const cat = getCategoryDetails(row.categoryId);
                  const gap = row.actual - row.planned;
                  const isPositiveBad = cat?.type === 'Dépense' && gap > 0;
                  const isDebt = cat?.type === 'Dette';
                  
                  return (
                    <tr key={row.id} className="hover:bg-white/30 dark:hover:bg-white/5 group transition-colors">
                      <td className="px-5 py-4 align-top">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                             {cat?.name}
                             {cat?.isRecurring && (
                                <span title={`Récurrent le ${cat.recurringDay}`} className="text-blue-500 flex items-center bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                    <Repeat size={10} className="mr-0.5" /> {cat.recurringDay}
                                </span>
                             )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{cat?.subCategory}</div>
                      </td>
                      <td className="px-5 py-4 align-top">
                          {isDebt && (
                             <div className="relative mb-2">
                                <select
                                    className="w-full text-xs p-2 rounded-xl border border-white/30 bg-white/40 dark:bg-black/20 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 outline-none appearance-none font-medium"
                                    value={row.debtId || ''}
                                    onChange={(e) => updateBudgetRow({...row, debtId: e.target.value})}
                                >
                                    <option value="">-- Lier dette --</option>
                                    {debts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                             </div>
                          )}
                          <input 
                              className="bg-transparent border-none w-full focus:ring-0 text-slate-600 dark:text-slate-300 placeholder-slate-400 p-0 text-sm font-medium"
                              placeholder={isDebt ? "Note..." : "Description..."}
                              value={row.description}
                              onChange={(e) => updateBudgetRow({...row, description: e.target.value})}
                          />
                      </td>
                      <td className="px-5 py-4 text-right align-top">
                          <input 
                              type="number"
                              className={`bg-transparent border-none w-24 text-right focus:ring-0 text-slate-500 dark:text-slate-400 p-0 font-semibold ${isPrivacyMode ? 'text-transparent' : ''}`}
                              value={row.planned}
                              onChange={(e) => updateBudgetRow({...row, planned: parseFloat(e.target.value) || 0})}
                          />
                          {isPrivacyMode && <div className="text-right text-slate-500 dark:text-slate-400 text-xs -mt-4 pointer-events-none">****</div>}
                      </td>
                      <td className="px-5 py-4 text-right align-top">
                           <input 
                                  type="number"
                                  className={`bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 w-24 text-right focus:ring-0 font-bold text-slate-800 dark:text-white p-0 transition-colors ${isPrivacyMode ? 'text-transparent' : ''}`}
                                  value={row.actual}
                                  onChange={(e) => updateBudgetRow({...row, actual: parseFloat(e.target.value) || 0})}
                              />
                           {isPrivacyMode && <div className="text-right text-slate-800 dark:text-white font-bold text-xs -mt-4 pointer-events-none">****</div>}
                      </td>
                      <td className={`px-5 py-4 text-right font-bold align-top ${isPositiveBad ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {formatMoney(gap, isPrivacyMode)}
                      </td>
                      <td className="px-5 py-4 text-center align-top">
                          <button onClick={() => deleteBudgetRow(row.id)} className="text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1 hover:bg-white/50 rounded">
                              <Trash2 size={16} />
                          </button>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Add Row Input */}
                {isAdding ? (
                  <tr className="bg-emerald-500/5 animate-in fade-in">
                      <td className="px-5 py-4 align-top">
                          <select 
                              className="w-full text-sm border border-white/30 rounded-xl bg-white/50 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50 outline-none p-2 font-medium"
                              value={newRow.categoryId}
                              onChange={(e) => setNewRow({...newRow, categoryId: e.target.value, debtId: ''})}
                          >
                              <option value="">Catégorie...</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                          </select>
                      </td>
                      <td className="px-5 py-4 align-top">
                          {getNewRowCatDetails()?.type === 'Dette' && (
                             <select
                                className="w-full mb-2 text-xs p-2 rounded-xl border border-white/30 bg-white/50 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                value={newRow.debtId || ''}
                                onChange={(e) => setNewRow({...newRow, debtId: e.target.value})}
                             >
                                <option value="">-- Lier dette --</option>
                                {debts.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                             </select>
                          )}
                          <input 
                              className="w-full text-sm border border-white/30 rounded-xl bg-white/50 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50 outline-none p-2"
                              placeholder="Description..."
                              value={newRow.description}
                              onChange={e => setNewRow({...newRow, description: e.target.value})}
                          />
                      </td>
                      <td className="px-5 py-4 align-top">
                          <input 
                              type="number"
                              className="w-full text-sm border border-white/30 rounded-xl bg-white/50 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50 outline-none p-2 text-right"
                              value={newRow.planned}
                              onChange={e => setNewRow({...newRow, planned: parseFloat(e.target.value)})}
                          />
                      </td>
                      <td className="px-5 py-4 align-top">
                          <input 
                              type="number"
                              className="w-full text-sm border border-white/30 rounded-xl bg-white/50 dark:bg-black/30 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/50 outline-none p-2 text-right"
                              value={newRow.actual}
                              onChange={e => setNewRow({...newRow, actual: parseFloat(e.target.value)})}
                          />
                      </td>
                      <td colSpan={2} className="px-5 py-4 text-right align-middle">
                          <div className="flex justify-end gap-2">
                            <button onClick={handleAdd} className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"><Save size={16} /></button>
                            <button onClick={() => setIsAdding(false)} className="bg-slate-200 text-slate-600 p-2 rounded-xl hover:bg-slate-300"><X size={16} /></button>
                          </div>
                      </td>
                  </tr>
                ) : (
                    <tr>
                        <td colSpan={6} className="px-5 py-4 text-left sm:text-center">
                            <button onClick={() => setIsAdding(true)} className="group text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 text-sm font-bold flex items-center justify-start sm:justify-center w-full sm:w-auto sm:mx-auto gap-2 transition-all py-2 px-3 sm:px-4 rounded-xl hover:bg-white/40 dark:hover:bg-white/5">
                                <div className="bg-slate-200 dark:bg-slate-700 group-hover:bg-emerald-500 group-hover:text-white rounded-full p-1 transition-colors">
                                    <Plus size={14} /> 
                                </div>
                                Ajouter une ligne
                            </button>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Distribution Chart - Liquid Glass */}
        <div className="lg:col-span-1 bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 p-8 transition-colors flex flex-col relative overflow-hidden">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 relative z-10">
              <PieIcon size={22} className="text-indigo-500" /> Répartition
            </h3>
            {chartData.length > 0 ? (
              <div className="flex-1 min-h-[300px] relative z-10">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart key={pieChartKey}>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip total={totalDistributed} />} />
                        <Legend wrapperStyle={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '12px' }} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-center text-sm relative z-10">
                <PieIcon size={48} className="mb-4 opacity-20" />
                Ajoutez des dépenses pour voir la répartition.
              </div>
            )}
            
            {/* Decorative Background Blob */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};