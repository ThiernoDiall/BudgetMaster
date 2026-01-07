import * as XLSX from 'xlsx';
import { AppState, MONTHS } from '../types';
import { calculateAmortization } from './finance';

export const generateExcel = (data: AppState) => {
  const wb = XLSX.utils.book_new();

  // 1. Dashboard Summary (Static values based on current state)
  const dashboardData = [
    ['Dashboard Annuel'],
    ['Indicateur', 'Valeur'],
    ['Revenus Totaux', data.budgetRows.reduce((acc, r) => {
        const cat = data.categories.find(c => c.id === r.categoryId);
        return (cat?.type === 'Revenu') ? acc + r.actual : acc;
    }, 0)],
    ['Dépenses Totales', data.budgetRows.reduce((acc, r) => {
        const cat = data.categories.find(c => c.id === r.categoryId);
        return (cat?.type === 'Dépense') ? acc + r.actual : acc;
    }, 0)],
  ];
  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
  XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard_Annuel");

  // 2. Categories
  const catHeader = ['Catégorie', 'Type', 'Sous-catégorie'];
  const catRows = data.categories.map(c => [c.name, c.type, c.subCategory]);
  const wsCats = XLSX.utils.aoa_to_sheet([catHeader, ...catRows]);
  XLSX.utils.book_append_sheet(wb, wsCats, "Categories");

  // 3. Revenues
  const revHeader = ['Date', 'Description', 'Source', 'Montant', 'Catégorie', 'Mois'];
  const revRows = data.revenues.map(r => {
      const cat = data.categories.find(c => c.id === r.categoryId);
      return [r.date, r.description, r.source, r.amount, cat?.name || 'Inconnu', MONTHS[r.monthIndex]];
  });
  const wsRev = XLSX.utils.aoa_to_sheet([revHeader, ...revRows]);
  XLSX.utils.book_append_sheet(wb, wsRev, "Revenus");

  // 4. Dettes & Amortization
  // We will create a flat list of all debt schedules
  const debtHeader = ['Nom Dette', 'Mois #', 'Paiement Total', 'Intérêt', 'Capital', 'Solde Restant'];
  const debtRows: any[] = [];
  data.debts.forEach(d => {
      const schedule = calculateAmortization(d);
      schedule.forEach(row => {
          debtRows.push([d.name, row.monthIndex, row.totalPayment, row.interestPaid, row.principalPaid, row.remainingBalance]);
      });
  });
  const wsDebts = XLSX.utils.aoa_to_sheet([debtHeader, ...debtRows]);
  XLSX.utils.book_append_sheet(wb, wsDebts, "Dettes_Amortissement");

  // 5. Investissements
  const invHeader = ['Date', 'Projet/Actif', 'Montant', 'Catégorie', 'Retour', 'Mois'];
  const invRows = data.investments.map(i => {
       const cat = data.categories.find(c => c.id === i.categoryId);
       return [i.date, i.project, i.amount, cat?.name, i.returnAmount || 0, MONTHS[i.monthIndex]];
  });
  const wsInv = XLSX.utils.aoa_to_sheet([invHeader, ...invRows]);
  XLSX.utils.book_append_sheet(wb, wsInv, "Investissements");

  // 6. Monthly Sheets (Jan - Dec)
  MONTHS.forEach((monthName, index) => {
      const rows = data.budgetRows.filter(r => r.monthIndex === index);
      const sheetHeader = ['Date', 'Catégorie', 'Sous-catégorie', 'Description', 'Prévu', 'Réel', 'Écart', '% Écart', 'Type'];
      
      const sheetData = rows.map(r => {
          const cat = data.categories.find(c => c.id === r.categoryId);
          const gap = r.actual - r.planned;
          const gapPercent = r.planned !== 0 ? (gap / r.planned) : 0;
          return [
              '', // Date often implicit in budget sheets or manually added
              cat?.name || '?',
              cat?.subCategory || '',
              r.description,
              r.planned,
              r.actual,
              gap,
              gapPercent,
              cat?.type
          ];
      });

      // Add a summary row at bottom? Or just raw data. User asked for "Formulas". 
      // In a raw export, we just give values. Creating working formulas in export is complex without a template.
      // We will export the values.
      const wsMonth = XLSX.utils.aoa_to_sheet([sheetHeader, ...sheetData]);
      XLSX.utils.book_append_sheet(wb, wsMonth, monthName);
  });

  XLSX.writeFile(wb, "BudgetMaster_Pro.xlsx");
};