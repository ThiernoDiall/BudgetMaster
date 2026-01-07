import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { formatCurrency, formatMoney } from '../utils/finance';
import { Download, TrendingUp, Wallet, CreditCard, PiggyBank } from 'lucide-react';
import { generateExcel } from '../utils/export';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#f472b6', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#60a5fa', '#a78bfa', '#e879f9', '#34d399', '#818cf8'];

// Helper to generate stable colors from strings
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
      <div className={`px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl ${isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-white/40'}`}>
        <p className="font-bold text-sm mb-1" style={{ color: payload[0].fill }}>
          {data.name}
        </p>
        <div className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          <span>{formatMoney(data.value, isPrivacyMode)}</span>
          <span className="ml-2 opacity-60">({percent}%)</span>
        </div>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  const { categories, budgetRows, debts, investments, revenues, isPrivacyMode, currentYear } = useBudget();
  const contextData = useBudget(); // For export
  const { isDark } = useTheme();

  // Filter by Year
  const yearRows = budgetRows.filter(r => r.year === currentYear);
  const yearRevenues = revenues.filter(r => r.year === currentYear);
  const yearInvestments = investments.filter(r => r.year === currentYear);

  // KPI Calculations
  const totalActualIncome = yearRows.reduce((acc, r) => {
    const cat = categories.find(c => c.id === r.categoryId);
    return (cat?.type === 'Revenu') ? acc + r.actual : acc;
  }, 0) + yearRevenues.reduce((acc, r) => acc + r.amount, 0);

  const totalExpenses = yearRows.reduce((acc, r) => {
      const cat = categories.find(c => c.id === r.categoryId);
      return (cat?.type === 'Dépense') ? acc + r.actual : acc;
  }, 0);

  const totalSavings = yearRows.reduce((acc, r) => {
      const cat = categories.find(c => c.id === r.categoryId);
      return (cat?.type === 'Épargne') ? acc + r.actual : acc;
  }, 0);

  const totalDebtsPaid = yearRows.reduce((acc, r) => {
      const cat = categories.find(c => c.id === r.categoryId);
      return (cat?.type === 'Dette') ? acc + r.actual : acc;
  }, 0);

  const savingsRate = totalActualIncome > 0 ? (totalSavings / totalActualIncome) * 100 : 0;
  const cashflow = totalActualIncome - totalExpenses - totalDebtsPaid - totalSavings;

  // Chart Data Preparation
  const relevantTypes = ['Dépense', 'Dette', 'Épargne', 'Investissement'];
  
  const categoryData = categories
    .filter(c => relevantTypes.includes(c.type))
    .map(c => {
        const value = yearRows.filter(r => r.categoryId === c.id).reduce((sum, r) => sum + r.actual, 0);
        return { name: c.name, value, type: c.type };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalDistributed = categoryData.reduce((acc, cur) => acc + cur.value, 0);
  const pieChartKey = JSON.stringify(categoryData.map(d => d.value));

  // Monthly Progression
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthRows = yearRows.filter(r => r.monthIndex === i);
      
      const mRevenu = monthRows.reduce((acc, r) => categories.find(c => c.id === r.categoryId)?.type === 'Revenu' ? acc + r.actual : acc, 0)
                    + yearRevenues.filter(r => r.monthIndex === i).reduce((acc, r) => acc + r.amount, 0);

      const mDepense = monthRows.reduce((acc, r) => categories.find(c => c.id === r.categoryId)?.type === 'Dépense' ? acc + r.actual : acc, 0);
      const mEpargne = monthRows.reduce((acc, r) => categories.find(c => c.id === r.categoryId)?.type === 'Épargne' ? acc + r.actual : acc, 0);

      return {
          name: new Date(0, i).toLocaleString('fr-CA', { month: 'short' }),
          revenus: mRevenu,
          depenses: mDepense,
          epargne: mEpargne
      };
  });

  const chartTextColor = isDark ? '#94a3b8' : '#64748b';
  const chartGridColor = isDark ? '#334155' : '#e2e8f0'; // Subtle grid lines
  const tooltipStyle = {
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)',
      color: isDark ? '#f1f5f9' : '#0f172a',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      borderWidth: '1px',
      boxShadow: '0 10px 30px -5px rgba(0,0,0,0.2)'
  };

  const formatTooltip = (val: number) => formatMoney(val, isPrivacyMode);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-4xl font-bold text-slate-800 dark:text-white drop-shadow-md tracking-tight">Dashboard {currentYear}</h2>
           <p className="text-lg text-slate-600 dark:text-slate-300 font-medium mt-1 opacity-80">Vue d'ensemble de votre santé financière</p>
        </div>
        <button 
          onClick={() => generateExcel(contextData)}
          className="group flex items-center gap-2 bg-white/40 dark:bg-black/40 hover:bg-white/60 dark:hover:bg-black/60 text-slate-800 dark:text-white px-5 py-3 rounded-2xl font-semibold shadow-lg backdrop-blur-xl border border-white/40 dark:border-white/10 transition-all hover:scale-105"
        >
            <Download size={20} className="text-emerald-500" />
            <span>Exporter Excel</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Revenus Totaux" value={totalActualIncome} icon={Wallet} color="text-emerald-500" isPrivacyMode={isPrivacyMode} />
        <KPICard title="Dépenses Annuelles" value={totalExpenses} icon={CreditCard} color="text-rose-500" isPrivacyMode={isPrivacyMode} />
        <KPICard title="Épargne Totale" value={totalSavings} sub={`${savingsRate.toFixed(1)}% Taux d'épargne`} icon={PiggyBank} color="text-blue-500" isPrivacyMode={isPrivacyMode} />
        <KPICard title="Cashflow Net" value={cashflow} icon={TrendingUp} color={cashflow >= 0 ? "text-emerald-500" : "text-rose-500"} isPrivacyMode={isPrivacyMode} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2 h-6 rounded-full bg-indigo-400"></span> Répartition Budgétaire
            </h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart key={pieChartKey}>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip total={totalDistributed} />} />
                        <Legend wrapperStyle={{ color: chartTextColor, paddingTop: '20px', fontSize: '12px' }} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 relative overflow-hidden">
            <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2 h-6 rounded-full bg-emerald-400"></span> Revenus vs Dépenses
            </h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} opacity={0.3} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: chartTextColor, fontSize: 12, fontWeight: 500}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: chartTextColor, fontSize: 12}} />
                        <Tooltip 
                            formatter={formatTooltip} 
                            cursor={{fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', radius: 8}} 
                            contentStyle={tooltipStyle}
                        />
                        <Legend wrapperStyle={{ color: chartTextColor, paddingTop: '20px' }} iconType="circle" />
                        <Bar dataKey="revenus" name="Revenus" fill="#34d399" radius={[6, 6, 6, 6]} barSize={16} />
                        <Bar dataKey="depenses" name="Dépenses" fill="#fb7185" radius={[6, 6, 6, 6]} barSize={16} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

       {/* Charts Row 2 */}
       <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/40 dark:border-white/5">
            <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2 h-6 rounded-full bg-blue-400"></span> Progression Épargne & Cashflow
            </h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} opacity={0.3} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: chartTextColor, fontSize: 12, fontWeight: 500}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: chartTextColor, fontSize: 12}} />
                        <Tooltip 
                            formatter={formatTooltip} 
                            contentStyle={tooltipStyle}
                        />
                        <Legend wrapperStyle={{ color: chartTextColor }} iconType="plainline" />
                        <Line type="monotone" dataKey="epargne" name="Épargne Cumulée" stroke="#60a5fa" strokeWidth={4} dot={{r: 4, fill: '#60a5fa', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
  );
};

const KPICard: React.FC<{ title: string; value: number; sub?: string; icon: any; color: string; isPrivacyMode: boolean }> = ({ title, value, sub, icon: Icon, color, isPrivacyMode }) => (
    <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 hover:-translate-y-2 transition-transform duration-300 group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon size={80} className={color.replace('text-', 'text-')} />
        </div>
        <div className="flex items-center gap-3 mb-3">
             <div className={`p-2.5 rounded-xl bg-white/50 dark:bg-white/10 ${color}`}>
                 <Icon size={20} />
             </div>
             <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
        </div>
        <p className={`text-3xl font-extrabold ${color} drop-shadow-sm`}>{formatMoney(value, isPrivacyMode)}</p>
        {sub && <div className="inline-block mt-2 px-2 py-1 rounded-lg bg-white/30 dark:bg-white/5 border border-white/20 text-xs font-semibold text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
);