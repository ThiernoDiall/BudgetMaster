import { Debt } from '../types';

export interface AmortizationRow {
  monthIndex: number;
  totalPayment: number;
  interestPaid: number;
  principalPaid: number;
  remainingBalance: number;
  cumulativeInterest: number;
}

export const calculateAmortization = (debt: Debt, monthsToProject = 60): AmortizationRow[] => {
  let balance = debt.initialBalance;
  const monthlyRate = debt.annualRate / 100 / 12;
  const schedule: AmortizationRow[] = [];
  let cumulativeInterest = 0;

  for (let i = 0; i < monthsToProject; i++) {
    if (balance <= 0) break;

    const interest = balance * monthlyRate;
    let principal = debt.monthlyPayment - interest;

    // Handle last payment
    if (balance < principal) {
        principal = balance;
    }
    
    // If payment is too low to cover interest, simple handle to avoid infinite loop in basic logic
    if (principal < 0) principal = 0; 

    balance -= principal;
    cumulativeInterest += interest;

    schedule.push({
      monthIndex: i + 1, // Relative month from start
      totalPayment: principal + interest,
      interestPaid: interest,
      principalPaid: principal,
      remainingBalance: balance < 0.01 ? 0 : balance,
      cumulativeInterest
    });
  }

  return schedule;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount);
};

export const formatMoney = (amount: number, isHidden: boolean) => {
  if (isHidden) return '**** $';
  return formatCurrency(amount);
};