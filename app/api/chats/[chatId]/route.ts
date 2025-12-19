import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import type { ChatAgentUIMessage } from "@/lib/chat/types";
import { allTools } from "@/lib/ai/tools";
import {
  ensureChatExists,
  persistMessage,
  getChatMessages,
  convertDbMessagesToUIMessages,
} from "@/lib/db/queries/chat";
import { v7 as uuidv7 } from "uuid";

const SYSTEM_PROMPT = `You are a tweet drafting assistant. Your job is to help users craft engaging, impactful tweets that fit within the 280 character limit. You understand the nuances of Twitter/X culture, including effective use of hashtags, mentions, and hooks that capture attention.

When drafting tweets, always use the countCharacters tool to verify the length before presenting a final draft. If a tweet is over the limit, proactively suggest shorter alternatives. Offer multiple variations when appropriate, and explain your reasoning for word choices and structure.`;

const MAX_MESSAGES_PER_CHAT = 2;

const RATE_LIMIT_MESSAGE = `You've reached the message limit for this demo (${MAX_MESSAGES_PER_CHAT} messages per conversation).

**Deploy your own instance** - Fork this project and deploy it on Vercel with your own API keys for unlimited usage

Check out the [GitHub repository](https://github.com/neondatabase-labs/agent-workflow-persistence) to get started with your own deployment!`;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;
  const { message }: { message: ChatAgentUIMessage } = await req.json();

  // Ensure chat exists before persisting messages
  await ensureChatExists(chatId);

  // Get existing conversation history
  const dbMessages = await getChatMessages(chatId);

  // Check rate limit before processing
  const userMessageCount = dbMessages.filter((m) => m.role === "user").length;
  if (userMessageCount >= MAX_MESSAGES_PER_CHAT) {
    const textId = uuidv7();
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: "start" });
        writer.write({ type: "start-step" });
        writer.write({ type: "text-start", id: textId });
        writer.write({
          type: "text-delta",
          id: textId,
          delta: RATE_LIMIT_MESSAGE,
        });
        writer.write({ type: "text-end", id: textId });
        writer.write({ type: "finish-step" });
        writer.write({ type: "finish", finishReason: "stop" });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  // Persist user message
  await persistMessage({ chatId, message });

  // Convert to UI messages and include the new user message for context
  const history = [...convertDbMessagesToUIMessages(dbMessages), message];

  const result = streamText({
    // Vercel AI Gateway - requires AI_GATEWAY_API_KEY env var
    model: "openai/gpt-5.1-instant",
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(history),
    tools: allTools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse({
    onFinish: async ({ responseMessage }) => {
      // Persist assistant response after streaming completes
      await persistMessage({
        chatId,
        message: responseMessage as ChatAgentUIMessage,
      });
    },
  });
}
