import { analyzeBankStatement } from './mastra/tools/bank-tool';

async function testTelexIntegration() {
  console.log('🔄 Testing Telex Integration...\n');

  // Simulate Telex request format
  const telexRequest = {
    jsonrpc: "2.0",
    id: "test-request",
    method: "message/send",
    params: {
      message: {
        kind: "message",
        role: "user",
        parts: [
          {
            kind: "text",
            text: `02-Nov-25 ATM WITHDRAWAL NGN 20,000.00 DR
03-Nov-25 TRANSFER FROM JOHN NGN 50,000.00 CR
01-Nov-25 SALARY PAYMENT 500,000.00 CR
05-Nov-25 POS SHOPRITE LEKKI 15,000.00 DR`
          }
        ],
        messageId: "test-message"
      }
    }
  };

  try {
    // Process the request
    const result = await analyzeBankStatement.execute({
      context: {
        input: telexRequest.params.message.parts[0].text
      },
      runtimeContext: {} as any
    });

    // Format response for Telex
    const telexResponse = {
      jsonrpc: "2.0",
      id: telexRequest.id,
      result: {
        message: {
          kind: "message",
          role: "assistant",
          parts: [
            {
              kind: "text",
              text: `📊 Bank Statement Analysis

Income: ₦${result.totalIncome.toLocaleString()}
Expenses: ₦${result.totalExpenses.toLocaleString()}
Net Balance: ₦${result.netBalance.toLocaleString()}

Categories:
${result.topCategories.map(cat => `• ${cat.category}: ₦${cat.total.toLocaleString()}`).join('\n')}

${result.summary}`
            }
          ],
          messageId: "response-" + telexRequest.params.message.messageId
        }
      }
    };

    console.log('📤 Telex Response:\n');
    console.log(JSON.stringify(telexResponse, null, 2));

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

testTelexIntegration().catch(console.error);