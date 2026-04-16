import { createTool } from "@convex-dev/agent";
import z from "zod";
import { internal } from "../../../_generated/api";
import { supportAgent } from "../agents/supportAgent";

export const escalateConversation = createTool({
  description: "Escalate the conversation to a human support agent. Use this when the customer requests a human, expresses repeated frustration, or when the knowledge base cannot resolve their issue.",
  args: z.object({}),
  handler: async (ctx) => {
    if (!ctx.threadId) {
      return "Missing thread ID";
    }

    await ctx.runMutation(internal.system.conversations.escalate, {
      threadId: ctx.threadId,
    });

    await supportAgent.saveMessage(ctx, {
      threadId: ctx.threadId,
      message: {
        role: "assistant",
        content: "I've flagged this conversation for a support specialist who will follow up with you shortly. If you have any additional context to share, feel free to leave it here.",
      }
    });

    return "Conversation escalated to a human support agent.";
  },
});