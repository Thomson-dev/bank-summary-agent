import { BankAgent } from './mastra/agents/bank-agent';

async function main() {
  // Sample transaction data
  const sampleTransactions = [
    { amount: 50000, category: 'Salary', description: 'Monthly salary', date: '2025-10-01' },
    { amount: -5000, category: 'Groceries', description: 'Shoprite', date: '2025-10-05' },
    { amount: -15000, category: 'Rent', description: 'Apartment rent', date: '2025-10-01' },
    { amount: -3000, category: 'Transportation', description: 'Uber rides', date: '2025-10-10' },
    { amount: -2000, category: 'Groceries', description: 'Market shopping', date: '2025-10-15' },
    { amount: -8000, category: 'Entertainment', description: 'Cinema & dinner', date: '2025-10-20' },
    { amount: 5000, category: 'Freelance', description: 'Side project', date: '2025-10-25' },
  ];

  // Use the agent
  const result = await BankAgent.generate(
    `Please analyze these bank transactions: ${JSON.stringify(sampleTransactions)}`
  );

  console.log('Agent Response:', result.text);
}

main();