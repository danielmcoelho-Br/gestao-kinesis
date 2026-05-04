"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PeriodContextType {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  initialized: boolean;
  setStartMonth: (m: number) => void;
  setStartYear: (y: number) => void;
  setEndMonth: (m: number) => void;
  setEndYear: (y: number) => void;
  updatePeriod: (startM: number, startY: number, endM: number, endY: number) => void;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [startMonth, setStartMonthState] = useState<number>(new Date().getMonth());
  const [startYear, setStartYearState] = useState<number>(new Date().getFullYear());
  const [endMonth, setEndMonthState] = useState<number>(new Date().getMonth());
  const [endYear, setEndYearState] = useState<number>(new Date().getFullYear());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const sM = localStorage.getItem('kinesis_start_month');
    const sY = localStorage.getItem('kinesis_start_year');
    const eM = localStorage.getItem('kinesis_end_month');
    const eY = localStorage.getItem('kinesis_end_year');
    
    if (sM) setStartMonthState(parseInt(sM));
    if (sY) setStartYearState(parseInt(sY));
    if (eM) setEndMonthState(parseInt(eM));
    if (eY) setEndYearState(parseInt(eY));
    
    setInitialized(true);
  }, []);

  const setStartMonth = (m: number) => {
    setStartMonthState(m);
    localStorage.setItem('kinesis_start_month', m.toString());
  };

  const setStartYear = (y: number) => {
    setStartYearState(y);
    localStorage.setItem('kinesis_start_year', y.toString());
  };

  const setEndMonth = (m: number) => {
    setEndMonthState(m);
    localStorage.setItem('kinesis_end_month', m.toString());
  };

  const setEndYear = (y: number) => {
    setEndYearState(y);
    localStorage.setItem('kinesis_end_year', y.toString());
  };

  const updatePeriod = (startM: number, startY: number, endM: number, endY: number) => {
    setStartMonthState(startM);
    setStartYearState(startY);
    setEndMonthState(endM);
    setEndYearState(endY);
    localStorage.setItem('kinesis_start_month', startM.toString());
    localStorage.setItem('kinesis_start_year', startY.toString());
    localStorage.setItem('kinesis_end_month', endM.toString());
    localStorage.setItem('kinesis_end_year', endY.toString());
  };

  return (
    <PeriodContext.Provider value={{ 
      startMonth, startYear, endMonth, endYear, initialized, 
      setStartMonth, setStartYear, setEndMonth, setEndYear,
      updatePeriod 
    }}>
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
