
export type CategoryType = 'Revenu' | 'Dépense' | 'Épargne' | 'Investissement' | 'Dette';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  subCategory: string;
  // Recurring features
  isRecurring?: boolean;
  recurringDay?: number; // Day of month (1-31)
  frequency?: 'monthly' | 'bimonthly';
  defaultAmount?: number;
  // Link to Debt entity
  linkedDebtId?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  source: string;
  amount: number;
  categoryId: string;
  monthIndex: number; // 0-11
  year: number;
}

export interface BudgetRow {
  id: string;
  categoryId: string; // Links to Category
  description: string;
  planned: number;
  actual: number;
  monthIndex: number; // 0-11
  year: number;
  debtId?: string; // Optional link to a specific Debt
}

export interface Debt {
  id: string;
  name: string;
  initialBalance: number;
  annualRate: number;
  monthlyPayment: number;
  startDate: string;
  // Credit Card specifics
  type?: 'loan' | 'credit_card';
  statementDay?: number;
  dueDay?: number;
  // Recurring Integration
  isRecurring?: boolean;
  recurringDay?: number;
  frequency?: 'monthly' | 'bimonthly';
}

export interface Investment {
  id: string;
  date: string;
  project: string;
  amount: number;
  categoryId: string;
  returnAmount?: number;
  monthIndex: number;
  year: number;
}

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export interface AppState {
  categories: Category[];
  revenues: Transaction[];
  investments: Investment[];
  debts: Debt[];
  budgetRows: BudgetRow[];
  currentYear: number;
  isPrivacyMode: boolean;
}