
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Category, Transaction, Debt, Investment, BudgetRow, CategoryType } from '../types';

// Initial Data Mock
const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Salaire', type: 'Revenu', subCategory: 'Principal', isRecurring: true, defaultAmount: 4000 },
  { id: '2', name: 'Freelance', type: 'Revenu', subCategory: 'Secondaire' },
  { id: '3', name: 'Loyer', type: 'Dépense', subCategory: 'Logement', isRecurring: true, recurringDay: 1, defaultAmount: 1200 },
  { id: '4', name: 'Épicerie', type: 'Dépense', subCategory: 'Alimentation', isRecurring: true, frequency: 'bimonthly', defaultAmount: 200 },
  { id: '5', name: 'Hydro', type: 'Dépense', subCategory: 'Logement', isRecurring: true, recurringDay: 15, defaultAmount: 80 },
  { id: '6', name: 'Internet', type: 'Dépense', subCategory: 'Services', isRecurring: true, recurringDay: 20, defaultAmount: 60 },
  { id: '7', name: 'CELI', type: 'Épargne', subCategory: 'Retraite', isRecurring: true, defaultAmount: 500 },
  { id: '8', name: 'Bourse', type: 'Investissement', subCategory: 'Actions' },
  // Linked debt example
  { id: '9', name: 'Prêt Auto', type: 'Dette', subCategory: 'Transport', isRecurring: true, recurringDay: 5, defaultAmount: 350, linkedDebtId: 'd1' },
];

const INITIAL_DEBTS: Debt[] = [
  { id: 'd1', name: 'Prêt Auto', initialBalance: 15000, annualRate: 5.5, monthlyPayment: 350, startDate: '2023-01-01', type: 'loan', isRecurring: true, recurringDay: 5, frequency: 'monthly' }
];

interface BudgetContextType extends AppState {
  setYear: (year: number) => void;
  togglePrivacy: () => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;
  addRevenue: (trx: Omit<Transaction, 'id'>) => void;
  deleteRevenue: (id: string) => void;
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  deleteDebt: (id: string) => void;
  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  deleteInvestment: (id: string) => void;
  updateBudgetRow: (row: BudgetRow) => void;
  addBudgetRow: (row: Omit<BudgetRow, 'id'>) => void;
  addBudgetRows: (rows: Omit<BudgetRow, 'id'>[]) => void;
  deleteBudgetRow: (id: string) => void;
  ensureRecurringRows: (year: number) => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(false);
  
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [revenues, setRevenues] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>(INITIAL_DEBTS);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>([]);

  // Seed initial data
  useEffect(() => {
    setBudgetRows(prev => {
        if (prev.length === 0) {
            const y = new Date().getFullYear();
            return [
                { id: 'br1', categoryId: '3', description: 'Loyer Janvier', planned: 1200, actual: 1200, monthIndex: 0, year: y },
                { id: 'br2', categoryId: '4', description: 'Courses', planned: 400, actual: 450, monthIndex: 0, year: y }
            ];
        }
        return prev;
    });
  }, []);

  // Ensure recurring rows exist for the selected year
  const ensureRecurringRows = (year: number) => {
    setBudgetRows(prev => {
      const newRows = [...prev];
      let hasChanges = false;

      categories.forEach(cat => {
        if (cat.isRecurring) {
          for (let month = 0; month < 12; month++) {
            // Check if row already exists for this category/month/year
            const exists = newRows.some(r => r.categoryId === cat.id && r.monthIndex === month && r.year === year);
            
            if (!exists) {
              hasChanges = true;
              const isBimonthly = cat.frequency === 'bimonthly';
              
              // Create 1st row
              newRows.push({
                id: Math.random().toString(36).substr(2, 9),
                categoryId: cat.id,
                description: `Paiement ${cat.name}`,
                planned: cat.defaultAmount || 0,
                actual: 0,
                monthIndex: month,
                year: year,
                debtId: cat.linkedDebtId // Auto-link to debt if it exists
              });

              // Create 2nd row if bimonthly
              if (isBimonthly) {
                newRows.push({
                  id: Math.random().toString(36).substr(2, 9),
                  categoryId: cat.id,
                  description: `Paiement ${cat.name} (2)`,
                  planned: cat.defaultAmount || 0,
                  actual: 0,
                  monthIndex: month,
                  year: year,
                  debtId: cat.linkedDebtId
                });
              }
            }
          }
        }
      });

      return hasChanges ? newRows : prev;
    });
  };

  // Run ensureRecurringRows when year changes or categories change
  useEffect(() => {
    ensureRecurringRows(currentYear);
  }, [currentYear, categories]);

  const togglePrivacy = () => setIsPrivacyMode(prev => !prev);
  const setYear = (y: number) => setCurrentYear(y);

  const addCategory = (cat: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...cat, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const updateCategory = (updatedCat: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
    
    // Sync rename back to Debt if linked
    if (updatedCat.linkedDebtId) {
        setDebts(prev => prev.map(d => {
            if (d.id === updatedCat.linkedDebtId) {
                // If the user changed the category name, update debt name?
                // Or if they changed recurrence...
                // For now, let's sync Name.
                return { ...d, name: updatedCat.name };
            }
            return d;
        }));
    }
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addRevenue = (trx: Omit<Transaction, 'id'>) => {
    setRevenues(prev => [...prev, { ...trx, id: Math.random().toString(36).substr(2, 9) }]);
  };
  
  const deleteRevenue = (id: string) => {
    setRevenues(prev => prev.filter(r => r.id !== id));
  };

  const addDebt = (debtData: Omit<Debt, 'id'>) => {
    const newDebtId = Math.random().toString(36).substr(2, 9);
    // Explicitly ensure recurrence flags are set on the debt object
    const newDebt = { 
        ...debtData, 
        id: newDebtId,
        isRecurring: true // Debts created via this flow are recurring by default
    };
    
    setDebts(prev => [...prev, newDebt]);

    // AUTOMATICALLY CREATE LINKED CATEGORY
    // Flow: Creation of Debt -> Creation of Category -> Auto-Creation of Budget Rows (via ensureRecurringRows)
    const newCategory: Category = {
        id: Math.random().toString(36).substr(2, 9),
        name: newDebt.name,
        type: 'Dette',
        subCategory: newDebt.type === 'credit_card' ? 'Carte de Crédit' : 'Prêt',
        // Map Recurrence settings from Debt to Category
        isRecurring: true, 
        frequency: newDebt.frequency || 'monthly',
        recurringDay: newDebt.recurringDay || 1,
        defaultAmount: newDebt.monthlyPayment, // Use the fixed monthly payment as default budget
        linkedDebtId: newDebtId
    };

    setCategories(prev => [...prev, newCategory]);
  };

  const deleteDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
    // Automatically delete linked category to prevent orphans
    setCategories(prev => prev.filter(c => c.linkedDebtId !== id));
  };

  const addInvestment = (inv: Omit<Investment, 'id'>) => {
    setInvestments(prev => [...prev, { ...inv, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  const updateBudgetRow = (updatedRow: BudgetRow) => {
    setBudgetRows(prev => prev.map(row => row.id === updatedRow.id ? updatedRow : row));
  };

  const addBudgetRow = (row: Omit<BudgetRow, 'id'>) => {
     setBudgetRows(prev => [...prev, { ...row, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const addBudgetRows = (rows: Omit<BudgetRow, 'id'>[]) => {
     const timestamp = Date.now().toString(36);
     const newRows = rows.map((r, i) => ({
         ...r,
         id: `${timestamp}-${i}-${Math.random().toString(36).substr(2, 5)}`
     }));
     setBudgetRows(prev => [...prev, ...newRows]);
  };

  const deleteBudgetRow = (id: string) => {
    setBudgetRows(prev => prev.filter(r => r.id !== id));
  };

  return (
    <BudgetContext.Provider value={{
      categories, revenues, debts, investments, budgetRows,
      currentYear, isPrivacyMode,
      setYear, togglePrivacy,
      addCategory, updateCategory, deleteCategory,
      addRevenue, deleteRevenue,
      addDebt, deleteDebt,
      addInvestment, deleteInvestment,
      updateBudgetRow, addBudgetRow, addBudgetRows, deleteBudgetRow, ensureRecurringRows
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};