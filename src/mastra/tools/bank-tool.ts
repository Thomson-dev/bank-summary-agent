// src/mastra/tools/bank-tool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface Transaction {
  amount: number;
  category?: string;
  description?: string;
  date?: string;
}

interface AnalysisResult {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  topCategories: { category: string; total: number }[];
  summary: string;
}

// Bank statement formats
// Format date to YYYY-MM-DD
const formatDate = (date: string, bank: string): string => {
  const months: Record<string, string> = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };

  switch (bank) {
    case 'GTB':
    case 'ACCESS':
    case 'ZENITH': {
      // Convert DD-MMM-YY or DD-MMM-YYYY to YYYY-MM-DD
      const [day, month, year] = date.split('-');
      const fullYear = year.length === 2 ? '20' + year : year;
      return `${fullYear}-${months[month.toUpperCase()]}-${day.padStart(2, '0')}`;
    }
    case 'UBA':
    case 'FIRSTBANK': {
      // Convert DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = date.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    default:
      return date;
  }
};

const BANK_FORMATS = {
  GTB: /(\d{2}-[A-Za-z]{3}-\d{2})\s+(.*?)\s+(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s+(CR|DR)/,
  ACCESS: /(\d{2}-[A-Za-z]{3}-\d{4})\s+(.*?)\s+NGN\s*(\d{1,3}(?:,\d{3})*\.\d{2})\s*(CR|DR)/,
  UBA: /(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+NGN\s*(\d{1,3}(?:,\d{3})*\.\d{2})\s*(C|D)/,
  ZENITH: /(\d{2}-[A-Za-z]{3}-\d{4})\s+(.*?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s+(CR|DR)/,
  FIRSTBANK: /(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+(\d{1,3}(?:,\d{3})*\.\d{2})\s+(CR|DR)/
};

const categorizeTransaction = (description: string): string => {
  const categories: Record<string, string[]> = {
    'Salary': ['salary', 'payroll', 'wages', 'payment for'],
    'Transfer': ['transfer', 'trf', 'xfer', 'fip'],
    'ATM': ['atm', 'pos', 'withdrawal'],
    'Bills': ['dstv', 'electricity', 'water', 'utility', 'bill'],
    'Food': ['restaurant', 'food', 'cafe', 'dining'],
    'Shopping': ['mall', 'store', 'market', 'shop'],
    'Transport': ['uber', 'bolt', 'taxi', 'fare'],
    'Airtime': ['airtime', 'data', 'mtn', 'glo', 'airtel'],
    'Entertainment': ['cinema', 'movie', 'game', 'netflix'],
    'Health': ['hospital', 'pharmacy', 'medical', 'drug']
  };

  const desc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return category;
    }
  }
  return 'Others';
};

// Bank Headers and Formats
const BANK_PATTERNS = {
  GTB: {
    header: /Guaranty Trust Bank PLC/i,
    columnHeader: /Date\s+Description\s+Debit\(N\)\s+Credit\(N\)\s+Balance\(N\)/i,
    row: /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.*?)\s+(?:(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|)\s*(?:(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/
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

// Parse text input into transactions
const parseTextToTransactions = (text: string): Transaction[] => {
  try {
    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {} // Ignore JSON parse error and try text parsing

    // Try parsing custom format: "YYYY-MM-DD: Category - Description, ₦Amount"
    const customFormat = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const match = line.match(/(\d{4}-\d{2}-\d{2}):\s*([^-]+)-\s*([^,]+),\s*₦([\d,]+)/);
        if (match) {
          const [, date, category, description, amount] = match;
          return {
            date,
            category: category.trim(),
            description: description.trim(),
            amount: parseFloat(amount.replace(/,/g, ''))
          };
        }
        return null;
      })
      .filter(t => t !== null);

    if (customFormat.length > 0) {
      return customFormat as Transaction[];
    }

    // Try parsing different bank formats
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const transactions: Transaction[] = [];

    for (const line of lines) {
      for (const [bank, format] of Object.entries(BANK_FORMATS)) {
        const match = line.match(format);
        if (match) {
          const [, date, description, amount, type] = match;
          const isCredit = type === 'CR' || type === 'C';
          const parsedAmount = parseFloat(amount.replace(/,/g, ''));
          
          transactions.push({
            date: formatDate(date, bank),
            description: description.trim(),
            category: categorizeTransaction(description),
            amount: isCredit ? parsedAmount : -parsedAmount
          });
          break;
        }
      }
    }

    if (transactions.length > 0) {
      return transactions;
    }

    throw new Error('Could not parse bank statement. Please ensure it matches one of the supported formats.');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse bank statement: ${errorMessage}`);
  }
};

export const analyzeBankStatement = createTool({
  id: 'analyze-bank-statement',
  description: "Analyzes a user's bank transactions and summarizes income, expenses, and savings patterns. Accepts both JSON array and text format.",
  inputSchema: z.object({
    input: z.union([
      z.array(
        z.object({
          amount: z.number(),
          category: z.string().optional(),
          description: z.string().optional(),
          date: z.string().optional(),
        })
      ),
      z.string()
    ])
  }),
  outputSchema: z.object({
    totalIncome: z.number(),
    totalExpenses: z.number(),
    netBalance: z.number(),
    topCategories: z.array(
      z.object({
        category: z.string(),
        total: z.number(),
      })
    ),
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const transactions = typeof context.input === 'string' 
      ? parseTextToTransactions(context.input)
      : context.input;
    return await analyzeBankData(transactions);
  },
});

// 🎯 Main Analysis Function (like getWeather)
const analyzeBankData = async (transactions: Transaction[]): Promise<AnalysisResult> => {
  const income = calculateIncome(transactions);
  const expenses = calculateExpenses(transactions);
  const netBalance = income - expenses;
  const topCategories = getTopSpendingCategories(transactions, 5);
  const summary = generateFinancialSummary(income, expenses, netBalance, topCategories);

  return {
    totalIncome: income,
    totalExpenses: expenses,
    netBalance,
    topCategories,
    summary,
  };
};

// 💰 Calculate Total Income
const calculateIncome = (transactions: Transaction[]): number => {
  return transactions
    .filter(t => t.amount > 0)
    .reduce((total, t) => total + t.amount, 0);
};

// 💸 Calculate Total Expenses
const calculateExpenses = (transactions: Transaction[]): number => {
  return transactions
    .filter(t => t.amount < 0)
    .reduce((total, t) => total + Math.abs(t.amount), 0);
};

// 📊 Get Top Spending Categories (like getWeatherCondition)
const getTopSpendingCategories = (
  transactions: Transaction[],
  topN: number = 5
): { category: string; total: number }[] => {
  const categoryTotals: Record<string, number> = {};

  // Group expenses by category
  transactions
    .filter(t => t.amount < 0)
    .forEach(t => {
      const category = t.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(t.amount);
    });

  // Sort and get top N
  return Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, topN);
};

// 💬 Generate Financial Summary
const generateFinancialSummary = (
  income: number,
  expenses: number,
  netBalance: number,
  topCategories: { category: string; total: number }[]
): string => {
  const formattedIncome = formatCurrency(income);
  const formattedExpenses = formatCurrency(expenses);
  const formattedBalance = formatCurrency(netBalance);
  const savingsRate = income > 0 ? ((netBalance / income) * 100).toFixed(1) : '0';

  // Format top categories with percentages
  const topCategoriesFormatted = topCategories.map(c => ({
    ...c,
    percentage: ((c.total / expenses) * 100).toFixed(1)
  }));

  const topCategoriesText = topCategoriesFormatted.length > 0
    ? `\n\nSpending Breakdown:\n${topCategoriesFormatted
        .map(c => `• ${c.category}: ${formatCurrency(c.total)} (${c.percentage}% of expenses)`)
        .join('\n')}`
    : '';

  // Generate financial health indicators
  const savingsRateHealth = parseFloat(savingsRate) >= 20 ? 'healthy' : parseFloat(savingsRate) >= 10 ? 'moderate' : 'low';
  const expenseRatio = expenses / income;
  const expenseHealth = expenseRatio <= 0.5 ? 'well-managed' : expenseRatio <= 0.7 ? 'moderate' : 'high';

  return `Financial Summary:
• Total Income: ${formattedIncome}
• Total Expenses: ${formattedExpenses}
• Net Balance: ${formattedBalance}
• Savings Rate: ${savingsRate}%${topCategoriesText}

Financial Health Assessment:
• Your savings rate is ${savingsRateHealth} (${savingsRate}% of income)
• Your expense ratio is ${expenseHealth} (${(expenseRatio * 100).toFixed(1)}% of income)
• ${netBalance >= 0 
    ? `You're maintaining a positive balance of ${formattedBalance}` 
    : `Warning: You're in a deficit of ${formattedBalance}`}

Recommendations:
${parseFloat(savingsRate) < 20 
  ? '• Consider increasing your savings rate to at least 20% of income'
  : '• Great job maintaining a healthy savings rate!'}
${expenseRatio > 0.7 
  ? '• Look for ways to reduce expenses in your top spending categories'
  : '• Keep maintaining your current expense management'}`;
};

// 🔢 Format Currency Helper
const formatCurrency = (amount: number): string => {
  return `₦${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// 📈 Additional Helper: Get Spending Trends (Optional)
const getSpendingTrend = (transactions: Transaction[]): 'increasing' | 'decreasing' | 'stable' => {
  if (transactions.length < 2) return 'stable';

  const sorted = [...transactions]
    .filter(t => t.amount < 0 && t.date)
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  if (sorted.length < 2) return 'stable';

  const midPoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midPoint).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const secondHalf = sorted.slice(midPoint).reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const difference = ((secondHalf - firstHalf) / firstHalf) * 100;

  if (difference > 10) return 'increasing';
  if (difference < -10) return 'decreasing';
  return 'stable';
};



// 📦 Sample Transactions for Testing
export const sampleTransactions: Transaction[] = [
  { amount: 50000, category: 'Salary', description: 'Monthly salary', date: '2025-10-01' },
  { amount: -5000, category: 'Groceries', description: 'Shoprite', date: '2025-10-05' },
  { amount: -15000, category: 'Rent', description: 'Apartment rent', date: '2025-10-01' },
  { amount: -3000, category: 'Transportation', description: 'Uber rides', date: '2025-10-10' },
  { amount: -2000, category: 'Groceries', description: 'Market shopping', date: '2025-10-15' },
  { amount: -8000, category: 'Entertainment', description: 'Cinema & dinner', date: '2025-10-20' },
  { amount: 5000, category: 'Freelance', description: 'Side project', date: '2025-10-25' },
  { amount: -4000, category: 'Utilities', description: 'Electricity & water', date: '2025-10-28' },
];
