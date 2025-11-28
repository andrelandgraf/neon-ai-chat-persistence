"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import type { ChatAgentUIMessage } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { v7 as uuidv7 } from "uuid";

interface ChatProps {
  chatId: string;
  initialMessages: ChatAgentUIMessage[];
}

export function Chat({ chatId, initialMessages }: ChatProps) {
  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    generateId: () => uuidv7(),
    id: chatId,
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
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-4">
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
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  message.role === "user"
                    ? "bg-[#00E599] text-black"
                    : "bg-muted",
                )}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <p key={index} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    );
                  }
                  if (part.type === "reasoning") {
                    return (
                      <details key={index} className="text-sm opacity-70">
                        <summary className="cursor-pointer">
                          Thinking...
                        </summary>
                        <p className="mt-1 whitespace-pre-wrap">{part.text}</p>
                      </details>
                    );
                  }
                  if (part.type.startsWith("tool-")) {
                    return (
                      <div
                        key={index}
                        className="my-2 rounded border border-current/20 bg-background/50 p-2 text-sm"
                      >
                        <span className="font-mono text-xs opacity-70">
                          {part.type.replace("tool-", "")}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
          {status === "streaming" && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-2">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce [animation-delay:0.1s]">
                    .
                  </span>
                  <span className="animate-bounce [animation-delay:0.2s]">
                    .
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

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
            disabled={status !== "ready"}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-muted px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00E599] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status !== "ready" || !input.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00E599] text-black transition-colors hover:bg-[#00cc88] disabled:opacity-50"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
