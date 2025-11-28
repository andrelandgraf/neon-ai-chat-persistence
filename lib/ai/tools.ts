import { tool } from "ai";
import { z } from "zod";

export const allTools = {
  countCharacters: tool({
    description:
      "Count the number of characters in a text. Use this to verify tweet length before finalizing.",
    inputSchema: z.object({
      text: z.string().describe("The text to count characters for"),
    }),
    execute: async ({ text }) => {
      const count = text.length;
      const remaining = 280 - count;
      return {
        characterCount: count,
        remainingCharacters: remaining,
        isWithinLimit: count <= 280,
        status:
          count <= 280
            ? `${count}/280 characters (${remaining} remaining)`
            : `${count}/280 characters (${Math.abs(remaining)} over limit)`,
      };
    },
  }),
};

// Tool type names for database schema - must match keys in allTools as "tool-{key}"
export const TOOL_TYPES = ["tool-countCharacters"] as const;

export type ToolType = (typeof TOOL_TYPES)[number];
