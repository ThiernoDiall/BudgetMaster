import React, { useState, useRef } from 'react';
import { useBudget } from '../context/BudgetContext';
import { readExcelFile, parseDate, parseAmount, checkIsDuplicate } from '../utils/importHelpers';
import { UploadCloud, ArrowRight, AlertTriangle, Check, FileSpreadsheet, X, HelpCircle, Save, AlertCircle } from 'lucide-react';
import { BudgetRow, Category, MONTHS } from '../types';

type Step = 'upload' | 'mapping' | 'categorize' | 'success';

interface ImportedTransaction {
  tempId: string;
  date: string;
  description: string;
  amount: number;
  categoryId: string;
  isDuplicate: boolean;
  selected: boolean;
  monthIndex: number;
  year: number;
}

// Helper to convert index to Excel column letters (A, B, C, ..., Z, AA, AB, ...)
const getColumnLetter = (index: number): string => {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
};

export const ImportWizard: React.FC = () => {
  const { categories, addBudgetRows, budgetRows } = useBudget();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [mapDate, setMapDate] = useState<number>(-1);
  const [mapDesc, setMapDesc] = useState<number>(-1);
  const [mapAmountPos, setMapAmountPos] = useState<number>(-1);
  const [mapAmountNeg, setMapAmountNeg] = useState<number>(-1);
  
  const [processedRows, setProcessedRows] = useState<ImportedTransaction[]>([]);
  const [summary, setSummary] = useState({ total: 0, added: 0 });

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      try {
        const rows = await readExcelFile(f);
        if (!rows || rows.length < 2) {
          throw new Error("Le fichier semble vide ou ne contient pas assez de données.");
        }
        setRawRows(rows);
        setStep('mapping');
        
        // Tentative d'auto-détection des en-têtes
        const header = rows[0].map((c: any) => String(c || '').toLowerCase());
        setMapDate(header.findIndex((h: string) => h.includes('date')));
        setMapDesc(header.findIndex((h: string) => h.includes('desc') || h.includes('libell') || h.includes('marchand') || h.includes('détails') || h.includes('label')));
        
        // Auto-detect Debit/Credit or general amount
        const posIdx = header.findIndex((h: string) => h.includes('crédit') || h.includes('credit') || h.includes('income') || h.includes('revenu') || h.includes('montant') || h.includes('amount') || h.includes('solde'));
        const negIdx = header.findIndex((h: string) => h.includes('débit') || h.includes('debit') || h.includes('dépense') || h.includes('expense') || h.includes('paiement'));
        
        if (posIdx !== -1) setMapAmountPos(posIdx);
        if (negIdx !== -1 && negIdx !== posIdx) setMapAmountNeg(negIdx);
        
      } catch (err: any) {
        console.error("Error reading file:", err);
        setError(err.message || "Erreur lors de la lecture du fichier. Assurez-vous qu'il s'agit d'un format valide.");
        setFile(null);
      }
      if (e.target) e.target.value = '';
    }
  };

  const handleMappingConfirm = () => {
    if (mapDate === -1 || mapDesc === -1 || (mapAmountPos === -1 && mapAmountNeg === -1)) {
      alert("Veuillez sélectionner au moins les colonnes Date, Description et une colonne de Montant.");
      return;
    }

    const transactions: ImportedTransaction[] = [];
    
    for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const dateStr = parseDate(row[mapDate]);
        const desc = row[mapDesc] ? String(row[mapDesc]).trim() : 'Sans description';
        
        const posVal = mapAmountPos !== -1 ? parseAmount(row[mapAmountPos]) : 0;
        const negVal = mapAmountNeg !== -1 ? parseAmount(row[mapAmountNeg]) : 0;
        
        let rawAmt = 0;
        if (mapAmountPos !== -1 && mapAmountNeg === -1) {
          rawAmt = posVal;
        } else if (mapAmountNeg !== -1 && mapAmountPos === -1) {
          rawAmt = -Math.abs(negVal);
        } else if (mapAmountPos !== -1 && mapAmountNeg !== -1) {
          rawAmt = Math.abs(posVal) - Math.abs(negVal);
        }

        if (dateStr && !isNaN(rawAmt)) {
             const dateObj = new Date(dateStr);
             const monthIndex = dateObj.getMonth();
             const year = dateObj.getFullYear();
             
             const relevantExisting = budgetRows.filter(r => r.monthIndex === monthIndex && r.year === year);
             const isDupe = checkIsDuplicate(dateStr, rawAmt, desc, relevantExisting);

             transactions.push({
                 tempId: `imp-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                 date: dateStr,
                 description: desc,
                 amount: Math.abs(rawAmt),
                 categoryId: '',
                 isDuplicate: isDupe,
                 selected: !isDupe,
                 monthIndex,
                 year
             });
        }
    }

    if (transactions.length === 0) {
      alert("Aucune transaction valide n'a été trouvée avec le mapping actuel.");
      return;
    }

    setProcessedRows(transactions);
    setStep('categorize');
  };

  const handleFinalize = () => {
    const selected = processedRows.filter(r => r.selected);
    const missingCat = selected.find(r => !r.categoryId);

    if (missingCat) {
        alert("Veuillez assigner une catégorie à toutes les transactions sélectionnées.");
        return;
    }

    if (selected.length === 0) {
        alert("Aucune transaction sélectionnée pour l'importation.");
        return;
    }

    const newBudgetRows: Omit<BudgetRow, 'id'>[] = selected.map(r => ({
        categoryId: r.categoryId,
        description: r.description,
        actual: r.amount,
        planned: 0,
        monthIndex: r.monthIndex,
        year: r.year
    }));

    addBudgetRows(newBudgetRows);
    setSummary({ total: processedRows.length, added: selected.length });
    setStep('success');
  };

  const toggleSelectRow = (id: string) => {
    setProcessedRows(prev => prev.map(r => r.tempId === id ? { ...r, selected: !r.selected } : r));
  };

  const updateCategory = (id: string, catId: string) => {
    setProcessedRows(prev => prev.map(r => r.tempId === id ? { ...r, categoryId: catId } : r));
  };

  if (step === 'upload') {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3 drop-shadow-md">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <UploadCloud size={24} />
            </div>
            Importer des transactions
        </h2>
        
        <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 text-center">
            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium animate-in shake duration-300">
                <AlertCircle size={20} />
                {error}
              </div>
            )}
            
            <div 
              onClick={handleTriggerFileInput}
              className="border-4 border-dashed border-emerald-500/30 dark:border-white/10 rounded-3xl p-8 sm:p-16 flex flex-col items-center justify-center hover:bg-white/20 dark:hover:bg-white/5 transition-all cursor-pointer group relative"
            >
                <div className="bg-emerald-500/10 dark:bg-black/30 p-6 sm:p-8 rounded-full mb-6 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg text-emerald-500">
                    <FileSpreadsheet size={48} />
                </div>
                <p className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Cliquez ou glissez votre relevé ici</p>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">Supporte les formats .CSV, .XLS, .XLSX</p>
                
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                    onChange={handleFileUpload}
                />
                
                <button 
                  type="button"
                  className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-emerald-500/20 group-hover:scale-105 transition-all pointer-events-none"
                >
                    Sélectionner un fichier
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (step === 'mapping') {
      const previewRows = rawRows.slice(0, 10);
      return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white drop-shadow-md">Configuration du mapping</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">Liez les colonnes de votre fichier aux champs de BudgetMaster.</p>
                </div>
                <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
                     <button 
                        onClick={() => setStep('upload')}
                        className="flex-1 sm:flex-none bg-white/40 dark:bg-white/10 text-slate-700 dark:text-slate-200 px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold backdrop-blur-md border border-white/20 hover:bg-white/60 transition-all"
                     >
                        Changer
                     </button>
                     <button onClick={handleMappingConfirm} className="flex-1 sm:flex-none bg-emerald-500 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transform hover:scale-105 transition-all">
                         Suivant <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                     </button>
                </div>
           </div>

           <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl p-4 sm:p-6 rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 overflow-x-auto">
               <table className="w-full text-left text-sm border-separate border-spacing-x-4">
                   <thead>
                       <tr>
                           {previewRows[0]?.map((col: any, idx: number) => (
                               <th key={idx} className="p-3 sm:p-4 min-w-[200px] bg-white/40 dark:bg-black/20 rounded-2xl mb-2">
                                   <div className="mb-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Colonne {getColumnLetter(idx)}</div>
                                   <select 
                                      className={`w-full p-2 sm:p-2.5 rounded-xl text-[10px] sm:text-xs font-bold border-2 transition-all cursor-pointer ${
                                          idx === mapDate ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' :
                                          idx === mapDesc ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300' :
                                          idx === mapAmountPos ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                                          idx === mapAmountNeg ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300' :
                                          'border-transparent bg-white/60 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/80'
                                      }`}
                                      value={idx === mapDate ? 'date' : idx === mapDesc ? 'desc' : idx === mapAmountPos ? 'amountPos' : idx === mapAmountNeg ? 'amountNeg' : ''}
                                      onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === 'date') setMapDate(idx);
                                          if (val === 'desc') setMapDesc(idx);
                                          if (val === 'amountPos') setMapAmountPos(idx);
                                          if (val === 'amountNeg') setMapAmountNeg(idx);
                                          if (val === '') {
                                              if (mapDate === idx) setMapDate(-1);
                                              if (mapDesc === idx) setMapDesc(-1);
                                              if (mapAmountPos === idx) setMapAmountPos(-1);
                                              if (mapAmountNeg === idx) setMapAmountNeg(-1);
                                          }
                                      }}
                                   >
                                       <option value="">Ignorer</option>
                                       <option value="date" className="text-indigo-600">Champ: Date 📅</option>
                                       <option value="desc" className="text-sky-600">Champ: Description 📝</option>
                                       <option value="amountPos" className="text-emerald-600">Transaction + (Crédit) 🟢</option>
                                       <option value="amountNeg" className="text-rose-600">Transaction - (Débit) 🔴</option>
                                   </select>
                               </th>
                           ))}
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-white/10">
                       {previewRows.map((row, rIdx) => (
                           <tr key={rIdx} className="hover:bg-white/10">
                               {row.map((cell: any, cIdx: number) => {
                                   let displayValue = cell !== null && cell !== undefined ? String(cell) : '';
                                   
                                   // User Story: conversion dynamique du format de date si la colonne est mappée
                                   if (cIdx === mapDate && rIdx > 0 && cell) {
                                       const formattedDate = parseDate(cell);
                                       if (formattedDate) {
                                           displayValue = formattedDate.replace(/-/g, '/');
                                       }
                                   }

                                   return (
                                       <td key={cIdx} className={`px-4 py-3 sm:py-4 truncate max-w-[200px] text-xs sm:text-sm text-slate-600 dark:text-slate-300 ${rIdx === 0 ? 'font-bold' : ''}`}>
                                           {displayValue}
                                       </td>
                                   );
                               })}
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
        </div>
      );
  }

  if (step === 'categorize') {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white drop-shadow-md">Validation</h2>
                    <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                      <span className="text-emerald-500 font-bold">{processedRows.filter(r => r.selected).length}</span> transactions prêtes.
                    </p>
                </div>
                <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
                  <button onClick={() => setStep('mapping')} className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2.5 bg-white/30 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border border-white/20 hover:bg-white/50 transition-all">
                    Retour
                  </button>
                  <button onClick={handleFinalize} className="flex-1 sm:flex-none bg-emerald-500 text-white px-4 py-2 sm:px-8 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-600 transition-all shadow-emerald-500/30 transform hover:scale-105">
                       <Save size={14} className="sm:w-4 sm:h-4" /> Valider
                  </button>
                </div>
            </div>

            <div className="bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/5 overflow-hidden flex-1 flex flex-col">
                 <div className="overflow-y-auto flex-1 custom-scrollbar">
                     <table className="w-full text-left text-xs sm:text-sm border-separate border-spacing-0">
                         <thead className="bg-white/40 dark:bg-black/20 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs sticky top-0 z-10 backdrop-blur-md">
                             <tr>
                                 <th className="px-4 py-3 sm:px-5 sm:py-4 w-10 text-center border-b border-white/10">
                                    <input type="checkbox" className="rounded-md border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" checked={processedRows.every(r => r.selected)} onChange={(e) => {
                                        const val = e.target.checked;
                                        setProcessedRows(prev => prev.map(r => ({...r, selected: val})));
                                    }} />
                                 </th>
                                 <th className="px-4 py-3 sm:px-5 sm:py-4 border-b border-white/10">Date</th>
                                 <th className="px-4 py-3 sm:px-5 sm:py-4 border-b border-white/10">Description</th>
                                 <th className="px-4 py-3 sm:px-5 sm:py-4 text-right border-b border-white/10">Montant</th>
                                 <th className="px-4 py-3 sm:px-5 sm:py-4 w-1/4 border-b border-white/10">Catégorie</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-white/20 dark:divide-white/5">
                             {processedRows.map(row => (
                                 <tr key={row.tempId} className={`hover:bg-white/30 dark:hover:bg-white/5 transition-colors ${!row.selected ? 'opacity-40 grayscale bg-slate-500/5' : ''}`}>
                                     <td className="px-4 py-3 sm:px-5 sm:py-4 text-center">
                                         <input 
                                            type="checkbox" 
                                            checked={row.selected} 
                                            onChange={() => toggleSelectRow(row.tempId)}
                                            className="rounded-md border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                         />
                                     </td>
                                     <td className="px-4 py-3 sm:px-5 sm:py-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{row.date}</td>
                                     <td className="px-4 py-3 sm:px-5 sm:py-4 text-slate-800 dark:text-slate-200 font-bold max-w-xs truncate">{row.description}</td>
                                     <td className="px-4 py-3 sm:px-5 sm:py-4 text-right text-slate-800 dark:text-slate-200 font-bold">{row.amount.toFixed(2)} $</td>
                                     <td className="px-4 py-3 sm:px-5 sm:py-4">
                                         <select 
                                            value={row.categoryId} 
                                            onChange={(e) => updateCategory(row.tempId, e.target.value)}
                                            disabled={!row.selected}
                                            className={`w-full p-2 rounded-xl text-xs font-medium border-2 outline-none transition-all ${
                                                !row.categoryId && row.selected 
                                                ? 'border-rose-400/50 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300' 
                                                : 'border-transparent bg-white/50 dark:bg-black/30 text-slate-900 dark:text-slate-100 hover:bg-white/70 shadow-sm'
                                            }`}
                                         >
                                             <option value="">-- Choisir --</option>
                                             {categories.map(cat => (
                                                 <option key={cat.id} value={cat.id} className="text-slate-900">{cat.name} ({cat.type})</option>
                                             ))}
                                         </select>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
            </div>
        </div>
      );
  }

  if (step === 'success') {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-in zoom-in-95 duration-500 px-4">
              <div className="bg-emerald-500/20 p-6 sm:p-8 rounded-full mb-8 backdrop-blur-md border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
                  <Check size={48} className="sm:w-16 sm:h-16 text-emerald-500" />
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-800 dark:text-white mb-4 text-center drop-shadow-md">Importation terminée !</h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-10 text-center max-w-md font-medium">
                  <span className="text-emerald-500 font-bold">{summary.added}</span> transactions ajoutées avec succès.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto">
                  <button onClick={() => window.location.reload()} className="bg-white/40 dark:bg-white/10 text-slate-700 dark:text-slate-200 px-8 py-3 rounded-2xl font-bold hover:bg-white/60 dark:hover:bg-white/20 transition-all border border-white/20 backdrop-blur-md shadow-lg">
                      Dashboard
                  </button>
                  <button onClick={() => {
                      setStep('upload');
                      setFile(null);
                      setRawRows([]);
                      setProcessedRows([]);
                      setError(null);
                      setMapAmountPos(-1);
                      setMapAmountNeg(-1);
                  }} className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-emerald-500/30 hover:scale-105 transition-all">
                      Nouvel import
                  </button>
              </div>
          </div>
      );
  }

  return null;
};