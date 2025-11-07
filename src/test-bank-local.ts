import { analyzeBankStatement } from './mastra/tools/bank-tool';

async function testBankAnalysis() {
  console.log('🏦 Testing Bank Statement Analysis...\n');

  const statement = `02-Nov-25 ATM WITHDRAWAL NGN 20,000.00 DR
03-Nov-25 TRANSFER FROM JOHN NGN 50,000.00 CR
01-Nov-25 SALARY PAYMENT 500,000.00 CR
05-Nov-25 POS SHOPRITE LEKKI 15,000.00 DR`;

  try {
    const result = await analyzeBankStatement.execute({
      context: {
        input: statement
      },
      runtimeContext: {} as any
    });

    console.log('📊 Analysis Result:\n');
    console.log(`Income: ${result.totalIncome}`);
    console.log(`Expenses: ${result.totalExpenses}`);
    console.log(`Net Balance: ${result.netBalance}`);
    console.log('\n📝 Categories:');
    result.topCategories.forEach(cat => {
      console.log(`- ${cat.category}: ${cat.total}`);
    });
    console.log('\n💡 Summary:\n', result.summary);

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    } else {
      console.error('❌ Error:', error);
    }
  }
}

testBankAnalysis().catch(console.error);