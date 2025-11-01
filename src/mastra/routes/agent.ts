import { registerApiRoute } from '@mastra/core/server';
import { randomUUID } from 'crypto';

interface JsonRpcRequest {
    jsonrpc?: string;
    id?: string | number | null;
    method?: string;
    params?: JsonRpcParams;
}

interface JsonRpcParams {
    message?: IncomingMessage;
    messages?: IncomingMessage[];
    contextId?: string;
    taskId?: string;
    metadata?: any;
}

interface MessagePart {
    kind: 'text' | 'data' | string;
    text?: string;
    data?: any;
}

interface IncomingMessage {
    role: string;
    parts?: MessagePart[];
    messageId?: string;
    taskId?: string;
}

interface MastraMessage {
    role: string;
    content: string;
}

interface AgentResponse {
    text?: string;
    toolResults?: any[];
}

interface ArtifactPart {
    kind: 'text' | 'data' | string;
    text?: string;
    data?: any;
}

interface Artifact {
    artifactId: string;
    name: string;
    parts: ArtifactPart[];
}

interface HistoryMessage {
    kind: 'message';
    role: string;
    parts?: MessagePart[];
    messageId: string;
    taskId: string;
}

interface Mastra {
    getAgent(agentId: string): Agent | undefined;
}

interface Agent {
    generate(messages: MastraMessage[]): Promise<AgentResponse>;
}

interface ApiRequest {
    param(name: string): string;
    json(): Promise<any>;
}

interface ApiResponse {
    (body: any, status?: number): any;
}

interface ApiContext {
    get(key: string): any;
    req: ApiRequest;
    json: ApiResponse;
}

export const agentApiRoute = registerApiRoute('/agent/:agentId', {
    method: 'POST',
    handler: async (c: ApiContext) => {
        try {
            const mastra = c.get('mastra') as Mastra;
            const agentId: string = c.req.param('agentId');
            const body: JsonRpcRequest = await c.req.json();

            // JSON-RPC validation
            const { jsonrpc, id: requestId, method, params } = body;
            if (jsonrpc !== '2.0' || !requestId) {
                return c.json({
                    jsonrpc: '2.0',
                    id: requestId || null,
                    error: { code: -32600, message: 'Invalid Request' }
                }, 400);
            }

            // Get agent
            const agent = mastra.getAgent(agentId);
            if (!agent) {
                return c.json({
                    jsonrpc: '2.0',
                    id: requestId,
                    error: { code: -32602, message: `Agent '${agentId}' not found` }
                }, 404);
            }

            // Extract messages
            const { message, messages, contextId, taskId, metadata } = params || {};
            let messagesList: IncomingMessage[] = [];
            if (message) messagesList = [message];
            else if (messages && Array.isArray(messages)) messagesList = messages;

            // Convert to Mastra format
            const mastraMessages: MastraMessage[] = messagesList.map((msg) => ({
                role: msg.role,
                content: msg.parts?.map((part) => {
                    if (part.kind === 'text') return part.text;
                    if (part.kind === 'data') return JSON.stringify(part.data);
                    return '';
                }).join('\n') || ''
            }));

            // Run agent
            const response: AgentResponse = await agent.generate(mastraMessages);
            const agentText: string = response.text || '';

            // Artifacts
            const artifacts: Artifact[] = [
                {
                    artifactId: randomUUID(),
                    name: `${agentId}Response`,
                    parts: [{ kind: 'text', text: agentText }]
                }
            ];
            if (response.toolResults && response.toolResults.length > 0) {
                artifacts.push({
                    artifactId: randomUUID(),
                    name: 'ToolResults',
                    parts: response.toolResults.map((result) => ({
                        kind: 'data',
                        data: result
                    }))
                });
            }

            // History
            const history: HistoryMessage[] = [
                ...messagesList.map((msg) => ({
                    kind: 'message',
                    role: msg.role,
                    parts: msg.parts,
                    messageId: msg.messageId || randomUUID(),
                    taskId: msg.taskId || taskId || randomUUID(),
                } as HistoryMessage)),
                ({
                    kind: 'message',
                    role: 'agent',
                    parts: [{ kind: 'text', text: agentText }],
                    messageId: randomUUID(),
                    taskId: taskId || randomUUID(),
                } as HistoryMessage)
            ];

            // JSON-RPC response
            return c.json({
                jsonrpc: '2.0',
                id: requestId,
                result: {
                    id: taskId || randomUUID(),
                    contextId: contextId || randomUUID(),
                    status: {
                        state: 'completed',
                        timestamp: new Date().toISOString(),
                        message: {
                            messageId: randomUUID(),
                            role: 'agent',
                            parts: [{ kind: 'text', text: agentText }],
                            kind: 'message' as const
                        }
                    },
                    artifacts,
                    history,
                    kind: 'task'
                }
            });

        } catch (error: any) {
            return c.json({
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32603,
                    message: 'Internal error',
                    data: { details: error?.message }
                }
            }, 500);
        }
    }
});