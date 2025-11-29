"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { v7 as uuidv7 } from "uuid";
import type { ChatAgentUIMessage, ChatToolPart } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

interface ChatProps {
  chatId: string;
  initialMessages: ChatAgentUIMessage[];
}

/**
 * Chat component with message persistence.
 *
 * Key concepts:
 * - Uses UUID v7 for message IDs (chronologically sortable)
 * - Sends only the latest message to the server (server loads full history from DB)
 * - Messages are persisted in the API route via onFinish callback
 * - initialMessages are loaded from the database on page load
 */
export function Chat({ chatId, initialMessages }: ChatProps) {
  const { messages, sendMessage, status } = useChat({
    id: chatId,
    messages: initialMessages,
    // Generate UUID v7 for new messages (required for DB compatibility)
    generateId: () => uuidv7(),
    transport: new DefaultChatTransport({
      api: `/api/chats/${chatId}`,
      // Send only the latest message (server loads full history)
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          message: messages[messages.length - 1],
        },
      }),
    }),
  });

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      sendMessage({ text: input });
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Conversation>
        <ConversationContent className="mx-auto max-w-2xl">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Start a conversation...</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%]",
                  message.role === "user" &&
                    "rounded-2xl bg-[#00E599] px-4 py-2 text-black",
                )}
              >
                {/*
                 * Render message parts based on type.
                 *
                 * AI SDK messages contain an array of "parts" that can be:
                 * - text: The main text content
                 * - reasoning: Model's chain-of-thought (if enabled)
                 * - tool-{name}: Tool calls and their results
                 * - source-url: Citations/references
                 * - file: Uploaded files
                 * - data-{type}: Custom data parts
                 */}
                {message.parts.map((part, index) => {
                  // Text part - the main message content
                  if (part.type === "text") {
                    return message.role === "user" ? (
                      <p key={index} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    ) : (
                      <div
                        key={index}
                        className="rounded-2xl bg-muted px-4 py-2"
                      >
                        <p className="whitespace-pre-wrap">{part.text}</p>
                      </div>
                    );
                  }

                  // Reasoning part - collapsible chain-of-thought
                  if (part.type === "reasoning") {
                    return (
                      <Reasoning key={index} defaultOpen={false}>
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );
                  }

                  // Tool parts - collapsible with input/output display
                  if (part.type.startsWith("tool-")) {
                    const toolPart = part as ChatToolPart;
                    const toolName = part.type.replace("tool-", "");
                    const toolType = part.type as `tool-${string}`;
                    // Map to compatible state for the Tool component
                    const displayState =
                      toolPart.state === "output-available"
                        ? "output-available"
                        : toolPart.state === "output-error"
                          ? "output-error"
                          : "input-available";

                    return (
                      <Tool key={index} defaultOpen={false}>
                        <ToolHeader
                          title={toolName}
                          type={toolType}
                          state={displayState}
                        />
                        <ToolContent>
                          <ToolInput input={toolPart.input} />
                          {"output" in toolPart && (
                            <ToolOutput
                              output={toolPart.output}
                              errorText={
                                "errorText" in toolPart
                                  ? toolPart.errorText
                                  : undefined
                              }
                            />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          ))}

          {/* Loading indicator when streaming or waiting for response */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2 text-muted-foreground">
                <Loader />
                <span className="text-sm">
                  {status === "submitted" ? "Sending..." : "Working..."}
                </span>
              </div>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t bg-background p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-end gap-2"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-muted px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00E599] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00E599] text-black transition-colors hover:bg-[#00cc88] disabled:opacity-50"
          >
            {isLoading ? <Loader /> : <SendHorizontal className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
