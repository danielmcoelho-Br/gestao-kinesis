"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PeriodContextType {
  month: number;
  year: number;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [month, setMonthState] = useState<number>(new Date().getMonth());
  const [year, setYearState] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const savedMonth = localStorage.getItem('kinesis_month');
    const savedYear = localStorage.getItem('kinesis_year');
    if (savedMonth) setMonthState(parseInt(savedMonth));
    if (savedYear) setYearState(parseInt(savedYear));
  }, []);

  const setMonth = (m: number) => {
    setMonthState(m);
    localStorage.setItem('kinesis_month', m.toString());
  };

  const setYear = (y: number) => {
    setYearState(y);
    localStorage.setItem('kinesis_year', y.toString());
  };

  return (
    <PeriodContext.Provider value={{ month, year, setMonth, setYear }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (context === undefined) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
}
