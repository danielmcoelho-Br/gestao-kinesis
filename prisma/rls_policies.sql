-- Habilitar RLS em todas as tabelas principais
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillingSession" ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA A TABELA Session
CREATE POLICY "Users can view their own sessions" ON "Session" 
FOR SELECT USING (auth.uid()::text = "ownerId");

CREATE POLICY "Users can insert their own sessions" ON "Session" 
FOR INSERT WITH CHECK (auth.uid()::text = "ownerId");

CREATE POLICY "Users can update their own sessions" ON "Session" 
FOR UPDATE USING (auth.uid()::text = "ownerId");

CREATE POLICY "Users can delete their own sessions" ON "Session" 
FOR DELETE USING (auth.uid()::text = "ownerId");

-- POLÍTICAS PARA A TABELA Patient
CREATE POLICY "Users can view their own patients" ON "Patient" 
FOR SELECT USING (auth.uid()::text = "ownerId");

CREATE POLICY "Users can insert their own patients" ON "Patient" 
FOR INSERT WITH CHECK (auth.uid()::text = "ownerId");

CREATE POLICY "Users can update their own patients" ON "Patient" 
FOR UPDATE USING (auth.uid()::text = "ownerId");

-- POLÍTICAS PARA A TABELA Transaction
CREATE POLICY "Users can view their own transactions" ON "Transaction" 
FOR SELECT USING (auth.uid()::text = "ownerId");

CREATE POLICY "Users can insert their own transactions" ON "Transaction" 
FOR INSERT WITH CHECK (auth.uid()::text = "ownerId");

-- POLÍTICAS PARA A TABELA BillingSession
CREATE POLICY "Users can view their own billing sessions" ON "BillingSession" 
FOR SELECT USING (auth.uid()::text = "ownerId");

CREATE POLICY "Users can insert their own billing sessions" ON "BillingSession" 
FOR INSERT WITH CHECK (auth.uid()::text = "ownerId");
