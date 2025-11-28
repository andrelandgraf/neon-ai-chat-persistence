import { streamText, convertToModelMessages } from "ai";
import type { ChatAgentUIMessage } from "@/lib/chat/types";
import { allTools } from "@/lib/ai/tools";
import {
  ensureChatExists,
  persistMessage,
  getChatMessages,
  convertDbMessagesToUIMessages,
} from "@/lib/db/queries/chat";

const systemPrompt = `You are a tweet drafting assistant. Your job is to help users craft engaging, impactful tweets that fit within the 280 character limit. You understand the nuances of Twitter/X culture, including effective use of hashtags, mentions, and hooks that capture attention.

When drafting tweets, always use the countCharacters tool to verify the length before presenting a final draft. If a tweet is over the limit, proactively suggest shorter alternatives. Offer multiple variations when appropriate, and explain your reasoning for word choices and structure.`;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;
  const { message }: { message: ChatAgentUIMessage } = await req.json();

  // Ensure chat exists before persisting messages
  await ensureChatExists(chatId);

  // Persist user message first
  await persistMessage({ chatId, message });

  // Get full conversation history for context
  const dbMessages = await getChatMessages(chatId);
  const history = convertDbMessagesToUIMessages(dbMessages);

  const result = streamText({
    // Vercel AI Gateway - requires AI_GATEWAY_API_KEY env var
    model: "google/gemini-3-pro-preview",
    system: systemPrompt,
    messages: convertToModelMessages(history),
    tools: allTools,
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
