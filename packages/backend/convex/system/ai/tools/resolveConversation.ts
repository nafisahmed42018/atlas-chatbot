import { createTool } from "@convex-dev/agent";
import z from "zod";
import { internal } from "../../../_generated/api";
import { supportAgent } from "../agents/supportAgent";

export const resolveConversation = createTool({
  description: "Mark the conversation as resolved. Use this only when the customer has confirmed their issue is fully resolved, they have no more questions, or they explicitly say goodbye or indicate they are done.",
  args: z.object({}),
  handler: async (ctx) => {
    if (!ctx.threadId) {
      return "Missing thread ID";
    }

    await ctx.runMutation(internal.system.conversations.resolve, {
      threadId: ctx.threadId,
    });

    await supportAgent.saveMessage(ctx, {
      threadId: ctx.threadId,
      message: {
        role: "assistant",
        content: "Happy to help! This conversation has been marked as resolved. Feel free to start a new chat anytime you need assistance.",
      }
    });

    return "Conversation resolved.";
  },
});