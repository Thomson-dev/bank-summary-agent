import { BankAgent } from './mastra/agents/bank-agent';
import { sampleTransactions } from './mastra/tools/bank-tool';

async function testBankAgent() {
  // You can now use the imported sampleTransactions or add your own

  console.log('🏦 Analyzing bank transactions...\n');

  try {
    const result = await BankAgent.generate(
      `Please analyze these bank transactions and provide a financial summary: ${JSON.stringify(sampleTransactions, null, 2)}`
    );

    console.log('📊 Agent Analysis:\n');
    console.log(result.text);
    
    if (result.object) {
      console.log('\n📋 Structured Data:\n', JSON.stringify(result.object, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

testBankAgent().catch(console.error);