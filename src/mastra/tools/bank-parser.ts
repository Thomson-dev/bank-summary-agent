// src/mastra/tools/bank-parser.ts
interface Transaction {
  amount: number;
  category?: string;
  description?: string;
  date?: string;
}

// Bank statement formats and patterns
const BANK_PATTERNS = {
  GTB: {
    header: /Guaranty Trust Bank PLC/i,
    simpleFormat: /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.*?)\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(CR|DR)$/,
    statementFormat: {
      header: /Date\s+Description\s+Debit\(N\)\s+Credit\(N\)\s+Balance\(N\)/i,
      row: /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.*?)\s+(?:(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|)\s*(?:(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|)\s*(?:\d{1,3}(?:,\d{3})*(?:\.\d{2})?)?$/
    }
  },
  ZENITH: {
    header: /Zenith Bank PLC/i,
    columnHeader: /Date\s+Value Date\s+Description\s+Withdrawals\s+Deposits\s+Balance/i,
    row: /^(\d{2}-[A-Za-z]{3}-\d{2})\s+\d{2}-[A-Za-z]{3}-\d{2}\s+(.*?)\s+(?:(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|)\s*(?:(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/
  },
  ACCESS: {
    header: /Access Bank PLC/i,
    columnHeader: /Date\s+Narration\s+Debit\s+Credit\s+Balance/i,
    row: /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.*?)\s+(?:(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|)\s*(?:(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/
  },
  UBA: {
    header: /United Bank for Africa PLC/i,
    columnHeader: /Date\s+Description\s+Dr\s*\(₦\)\s+Cr\s*\(₦\)\s+Balance\s*\(₦\)/i,
    row: /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.*?)\s+(?:(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|)\s*(?:(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/
  }
};

// Transaction categories with keywords
const TRANSACTION_CATEGORIES: Record<string, string[]> = {
  'Salary': ['salary', 'payroll', 'wages', 'payment for', 'credit'],
  'Transfer': ['transfer', 'trf', 'xfer', 'fip', 'from', 'to'],
  'ATM': ['atm', 'pos', 'withdrawal'],
  'Bills': ['dstv', 'electricity', 'water', 'utility', 'bill', 'phcn', 'dstv', 'gotv'],
  'Food': ['restaurant', 'food', 'cafe', 'dining', 'shoprite', 'spar'],
  'Shopping': ['mall', 'store', 'market', 'shop', 'jumia', 'konga'],
  'Transport': ['uber', 'bolt', 'taxi', 'fare', 'transport'],
  'Airtime': ['airtime', 'data', 'mtn', 'glo', 'airtel', '9mobile'],
  'Entertainment': ['cinema', 'movie', 'game', 'netflix', 'bet9ja', 'betting'],
  'Health': ['hospital', 'pharmacy', 'medical', 'drug', 'clinic'],
  'Bank Charges': ['charge', 'fee', 'commission', 'vat']
};

// Format date to YYYY-MM-DD
const formatDate = (date: string, bank: string): string => {
  const months: Record<string, string> = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };

  const [day, month, year] = date.split('-');
  const fullYear = year.length === 2 ? '20' + year : year;
  return `${fullYear}-${months[month.toUpperCase()]}-${day.padStart(2, '0')}`;
};

// Categorize transaction based on description
const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(TRANSACTION_CATEGORIES)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return category;
    }
  }
  return 'Others';
};

// Parse bank statement text into transactions
export const parseBankStatement = (text: string): Transaction[] => {
  try {
    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {} // Ignore JSON parse error and try text parsing

    // Try parsing bank statements
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Try parsing simple GTB format first
    const simpleGtbLines = lines
      .filter(line => /^\d{2}-[A-Za-z]{3}-\d{2}\s+.*?\s+\d[\d,]*\.?\d*\s+(CR|DR)$/.test(line));

    if (simpleGtbLines.length > 0) {
      return simpleGtbLines.map(line => {
        const [datePart, ...rest] = line.split(/\s+/);
        const type = rest[rest.length - 1];
        const amount = rest[rest.length - 2];
        const description = rest.slice(0, -2).join(' ');
        
        return {
          date: formatDate(datePart, 'GTB'),
          description,
          category: categorizeTransaction(description),
          amount: type === 'CR' ? 
            parseFloat(amount.replace(/,/g, '')) : 
            -parseFloat(amount.replace(/,/g, ''))
        } as Transaction;
      });
    }
    const transactions: Transaction[] = [];

    // Try parsing simple GTB format first (DD-MMM-YY DESCRIPTION AMOUNT CR/DR)
    const gtbSimpleTransactions = lines
      .map(line => {
        const match = line.match(BANK_PATTERNS.GTB.simpleFormat);
        if (match) {
          const [, date, description, amount, type] = match;
          return {
            date: formatDate(date, 'GTB'),
            description: description.trim(),
            category: categorizeTransaction(description),
            amount: type === 'CR' ? parseFloat(amount.replace(/,/g, '')) : -parseFloat(amount.replace(/,/g, ''))
          } as Transaction;
        }
        return null;
      })
      .filter((t): t is Transaction => t !== null);

    if (gtbSimpleTransactions.length > 0) {
      return gtbSimpleTransactions;
    }

    // Try parsing full statement format
    let bankType: keyof typeof BANK_PATTERNS | null = null;
    let isTransactionSection = false;

    // Detect bank type from header
    for (const [bank, patterns] of Object.entries(BANK_PATTERNS)) {
      if (lines.some(line => patterns.header.test(line))) {
        bankType = bank as keyof typeof BANK_PATTERNS;
        break;
      }
    }

    if (bankType === 'GTB') {
      for (const line of lines) {
        if (BANK_PATTERNS.GTB.statementFormat.header.test(line)) {
          isTransactionSection = true;
          continue;
        }
        if (line.startsWith('--') || line.includes('Opening Balance') || line.includes('Closing Balance')) {
          continue;
        }

        if (isTransactionSection) {
          const match = line.match(BANK_PATTERNS.GTB.statementFormat.row);
          if (match) {
            const [, date, description, debit, credit] = match;
            const amount = credit 
              ? parseFloat(credit.replace(/,/g, ''))
              : debit 
                ? -parseFloat(debit.replace(/,/g, ''))
                : 0;

            if (amount !== 0) {
              transactions.push({
                date: formatDate(date, bankType),
                description: description.trim(),
                category: categorizeTransaction(description),
                amount
              });
            }
          }
        }
      }

      if (transactions.length > 0) {
        return transactions;
      }
    }

    // Try parsing simple format as fallback
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const match = line.match(/(\d{4}-\d{2}-\d{2}):\s*([^-]+)-\s*([^,]+),\s*₦([\d,]+)/);
        if (!match) throw new Error(`Invalid line format: ${line}`);
        
        const [, date, category, description, amount] = match;
        return {
          date,
          category: category.trim(),
          description: description.trim(),
          amount: parseFloat(amount.replace(/,/g, ''))
        };
      });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse bank statement: ${errorMessage}`);
  }
};