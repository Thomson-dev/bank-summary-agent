import { BankAgent } from './mastra/agents/bank-agent';
import { sampleTransactions } from './mastra/tools/bank-tool';

async function testBankAgentDetailed() {
  console.log('🔍 Starting Bank Agent Test...\n');
  
  // Step 1: Check Agent Configuration
  console.log('✓ Agent Name:', BankAgent.name);
  console.log('✓ Tools Available:', BankAgent.tools?.length || 0);
  console.log('\n---\n');

  // Step 2: Check Sample Data
  console.log('📊 Sample Transactions:', sampleTransactions.length);
  console.log('First transaction:', sampleTransactions[0]);
  console.log('\n---\n');

  // Step 3: Test the Agent
  console.log('🏦 Analyzing bank transactions...\n');

  try {
    const startTime = Date.now();
    
    const result = await BankAgent.generate(
      `Please analyze these bank transactions and provide a financial summary: ${JSON.stringify(sampleTransactions, null, 2)}`
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('✅ SUCCESS! Agent responded in', duration, 'seconds\n');
    console.log('📊 Agent Analysis:\n');
    console.log(result.text);
    console.log('\n---\n');
    
    // Step 4: Check Response Quality
    const response = result.text || '';
    console.log('📈 Response Analysis:');
    console.log('- Length:', response.length, 'characters');
    console.log('- Contains "income":', response.toLowerCase().includes('income') ? '✓' : '✗');
    console.log('- Contains "expenses":', response.toLowerCase().includes('expenses') ? '✓' : '✗');
    console.log('- Contains "balance":', response.toLowerCase().includes('balance') ? '✓' : '✗');
    console.log('- Contains currency (₦):', response.includes('₦') ? '✓' : '✗');
    
  } catch (error: any) {
    console.error('❌ FAILED! Error occurred:\n');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('\nFull Error:', error);
    throw error;
  }
}

testBankAgentDetailed().catch(console.error);
