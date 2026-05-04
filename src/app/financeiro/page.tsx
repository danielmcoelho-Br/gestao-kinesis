"use client";

import { useEffect, useState } from "react";
import { usePeriod } from "@/context/PeriodContext";
import { CreditCard, TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";
import FinanceiroPageContent from "./page_content";
import { ReportHeader } from "@/components/ReportHeader";

export default function FinanceiroPage() {
  return (
    <div className="dashboard-container">
      <ReportHeader title="Financeiro Clínica" />
      <FinanceiroPageContent />
    </div>
  );
}
