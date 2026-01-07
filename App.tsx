
import React, { useState } from 'react';
import { BudgetProvider } from './context/BudgetContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Categories } from './components/Categories';
import { Debts } from './components/Debts';
import { MonthlySheet } from './components/MonthlySheet';
import { Revenues } from './components/Revenues';
import { Investments } from './components/Investments';
import { ImportWizard } from './components/ImportWizard';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    if (currentView === 'dashboard') return <Dashboard />;
    if (currentView === 'categories') return <Categories />;
    if (currentView === 'debts') return <Debts />;
    if (currentView === 'revenues') return <Revenues />;
    if (currentView === 'investments') return <Investments />;
    if (currentView === 'import') return <ImportWizard />;
    
    if (currentView.startsWith('month-')) {
        const idx = parseInt(currentView.split('-')[1]);
        return <MonthlySheet monthIndex={idx} />;
    }

    return <Dashboard />;
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BudgetProvider>
        <AppContent />
      </BudgetProvider>
    </ThemeProvider>
  );
};

export default App;
