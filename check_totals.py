import sqlite3
db = sqlite3.connect('prisma/dev.db')
db.row_factory = sqlite3.Row
c = db.cursor()
c.execute('SELECT * FROM "Transaction"')
txs = c.fetchall()

totals = {'KINESIS':0, 'DANIEL':0, 'STUART':0, 'PAULA':0, 'PILATES':0, 'FUNDO':0}
totals_bb = {'KINESIS':0, 'DANIEL':0, 'STUART':0, 'PAULA':0, 'PILATES':0, 'FUNDO':0}

for t in txs:
    if t['bank'] == 'MANUAL_CLINICA' or t['category'] == 'PRO_EARNING' or t['bank'] == 'HIDDEN_ITEM' or t['category'] == 'PARTNER_ADJ':
        continue
    
    fav = (t['favorecido'] or '').upper()
    if fav in totals:
        amount = t['amount'] if t['type'] == 'INCOME' else -t['amount']
        
        # Original logic
        totals[fav] += amount
        
        # New BB logic
        bank_name = (t['bank'] or 'Banco do Brasil').lower()
        if bank_name == 'banco do brasil':
            totals_bb[fav] += amount

print('Totals (Original logic):', totals)
print('Totals (BB logic):', totals_bb)
