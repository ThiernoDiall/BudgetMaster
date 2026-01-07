import React, { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import { Trash2, Plus, Calendar, Repeat, Link as LinkIcon, Edit2, X, Save } from 'lucide-react';
import { CategoryType, Category } from '../types';

export const Categories: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useBudget();
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newSub, setNewSub] = useState('');
  const [newType, setNewType] = useState<CategoryType>('Dépense');
  
  // Recurring State
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState(1);
  const [frequency, setFrequency] = useState<'monthly' | 'bimonthly'>('monthly');
  const [defaultAmount, setDefaultAmount] = useState(0);

  const resetForm = () => {
    setNewName('');
    setNewSub('');
    setNewType('Dépense');
    setIsRecurring(false);
    setDefaultAmount(0);
    setRecurringDay(1);
    setFrequency('monthly');
    setEditingId(null);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setNewSub(cat.subCategory);
    setNewType(cat.type);
    setIsRecurring(!!cat.isRecurring);
    setRecurringDay(cat.recurringDay || 1);
    setFrequency(cat.frequency || 'monthly');
    setDefaultAmount(cat.defaultAmount || 0);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const catData = {
        name: newName, 
        subCategory: newSub, 
        type: newType,
        isRecurring,
        recurringDay: isRecurring ? recurringDay : undefined,
        frequency: isRecurring ? frequency : undefined,
        defaultAmount: isRecurring ? defaultAmount : undefined
    };

    if (editingId) {
        const original = categories.find(c => c.id === editingId);
        updateCategory({ ...catData, id: editingId, linkedDebtId: original?.linkedDebtId });
    } else {
        addCategory(catData);
    }
    
    resetForm();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white drop-shadow-md">Gestion des Catégories</h2>
        {editingId && (
             <button onClick={resetForm} className="text-sm px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold flex items-center gap-1 transition-colors">
                 <X size={14} /> Annuler l'édition
             </button>
        )}
      </div>
      
      {/* Form - Liquid Glass */}
      <div className={`p-8 rounded-3xl shadow-2xl border backdrop-blur-2xl transition-all duration-300 ${editingId ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/40 dark:bg-slate-900/40 border-white/40 dark:border-white/5'}`}>
        <div className="flex items-center gap-3 mb-6">
             <div className={`p-2 rounded-xl ${editingId ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
             </div>
             <h3 className={`text-xl font-bold ${editingId ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200'}`}>
                 {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
             </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Nom de catégorie</label>
              <input 
                type="text" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                className="w-full px-5 py-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/30 dark:bg-black/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white/50 focus:ring-4 focus:ring-white/20 outline-none transition-all shadow-inner backdrop-blur-sm"
                placeholder="Ex: Épicerie"
              />
            </div>
            <div className="flex-1 w-full space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Sous-catégorie</label>
              <input 
                type="text" 
                value={newSub} 
                onChange={e => setNewSub(e.target.value)}
                className="w-full px-5 py-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/30 dark:bg-black/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white/50 focus:ring-4 focus:ring-white/20 outline-none transition-all shadow-inner backdrop-blur-sm"
                placeholder="Ex: Alimentation"
              />
            </div>
            <div className="w-full md:w-56 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Type</label>
              <div className="relative">
                <select 
                    value={newType} 
                    onChange={e => setNewType(e.target.value as CategoryType)}
                    className="w-full px-5 py-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/30 dark:bg-black/20 text-slate-800 dark:text-slate-100 focus:bg-white/50 focus:ring-4 focus:ring-white/20 outline-none transition-all shadow-inner backdrop-blur-sm appearance-none cursor-pointer font-medium"
                >
                    <option value="Revenu" className="text-slate-900">Revenu</option>
                    <option value="Dépense" className="text-slate-900">Dépense</option>
                    <option value="Épargne" className="text-slate-900">Épargne</option>
                    <option value="Investissement" className="text-slate-900">Investissement</option>
                    <option value="Dette" className="text-slate-900">Dette</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Recurring Options */}
          <div className="bg-white/20 dark:bg-black/20 p-6 rounded-2xl space-y-4 border border-white/20 dark:border-white/5 backdrop-blur-sm">
             <div className="flex items-center space-x-3">
                 <input 
                    type="checkbox" 
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={e => setIsRecurring(e.target.checked)}
                    className="w-5 h-5 text-emerald-500 rounded-lg border-white/40 bg-white/40 focus:ring-offset-0 focus:ring-2 focus:ring-emerald-500/50"
                 />
                 <label htmlFor="isRecurring" className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
                    <Repeat size={18} className="text-blue-500" /> Paiement Récurrent Automatique
                 </label>
             </div>

             {isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 pt-2">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Fréquence</label>
                        <select 
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as 'monthly' | 'bimonthly')}
                            className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/40 dark:bg-black/40 text-sm focus:ring-2 focus:ring-blue-400/50 outline-none"
                        >
                            <option value="monthly" className="text-slate-900">Mensuel</option>
                            <option value="bimonthly" className="text-slate-900">Bi-mensuel</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Jour du mois</label>
                        <input 
                            type="number" 
                            min="1" max="31"
                            value={recurringDay}
                            onChange={(e) => setRecurringDay(parseInt(e.target.value))}
                            className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/40 dark:bg-black/40 text-sm focus:ring-2 focus:ring-blue-400/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">Montant par défaut</label>
                        <input 
                            type="number" 
                            min="0"
                            value={defaultAmount}
                            onChange={(e) => setDefaultAmount(parseFloat(e.target.value))}
                            className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/40 dark:bg-black/40 text-sm focus:ring-2 focus:ring-blue-400/50 outline-none"
                        />
                    </div>
                </div>
             )}
          </div>

          <div className="flex gap-4 pt-2">
              <button 
                type="submit" 
                className={`flex-1 px-6 py-3 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-xl ${editingId ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30' : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30'}`}
              >
                {editingId ? (
                    <><Save size={20} /> Mettre à jour</>
                ) : (
                    <><Plus size={20} /> Ajouter la catégorie</>
                )}
              </button>
          </div>
        </form>
      </div>

      {/* Table - Liquid Glass */}
      <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/40 dark:bg-white/5 border-b border-white/20 dark:border-white/5 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-6 py-5 font-bold">Catégorie</th>
              <th className="hidden md:table-cell px-6 py-5 font-bold">Sous-catégorie</th>
              <th className="hidden md:table-cell px-6 py-5 font-bold">Type</th>
              <th className="px-6 py-5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 dark:divide-white/5 text-sm">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-slate-800 dark:text-slate-200">
                    <div className="font-bold text-base flex items-center gap-2">
                        {cat.name}
                        {cat.linkedDebtId && (
                            <div className="flex items-center gap-1 bg-rose-500/20 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-rose-500/20">
                                <LinkIcon size={10} /> Lié dette
                            </div>
                        )}
                    </div>
                    <div className="md:hidden text-xs text-slate-500 opacity-80 mt-1">{cat.subCategory} • {cat.type}</div>
                    {cat.isRecurring && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1 font-medium">
                            <Repeat size={12} /> 
                            {cat.frequency === 'bimonthly' ? 'Bi-mensuel' : 'Mensuel'} le {cat.recurringDay}
                        </div>
                    )}
                </td>
                <td className="hidden md:table-cell px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{cat.subCategory}</td>
                <td className="hidden md:table-cell px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-sm
                    ${cat.type === 'Revenu' ? 'bg-green-400/20 text-green-700 dark:text-green-300 border-green-400/30' :
                      cat.type === 'Dépense' ? 'bg-rose-400/20 text-rose-700 dark:text-rose-300 border-rose-400/30' :
                      cat.type === 'Épargne' ? 'bg-blue-400/20 text-blue-700 dark:text-blue-300 border-blue-400/30' :
                      cat.type === 'Dette' ? 'bg-orange-400/20 text-orange-700 dark:text-orange-300 border-orange-400/30' :
                      'bg-purple-400/20 text-purple-700 dark:text-purple-300 border-purple-400/30'}`}>
                    {cat.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(cat)} className="p-2 text-slate-500 hover:text-amber-500 hover:bg-white/50 rounded-xl transition-all" title="Modifier">
                            <Edit2 size={18} />
                        </button>
                        {!cat.linkedDebtId ? (
                            <button onClick={() => deleteCategory(cat.id)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-white/50 rounded-xl transition-all" title="Supprimer">
                                <Trash2 size={18} />
                            </button>
                        ) : (
                            <span className="p-2 text-slate-300 cursor-not-allowed" title="Géré via l'onglet Dettes">
                                <Trash2 size={18} />
                            </span>
                        )}
                    </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium italic">Aucune catégorie définie pour le moment.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};