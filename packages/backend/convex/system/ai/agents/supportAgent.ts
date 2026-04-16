import { openai } from "@ai-sdk/openai";
import { Agent } from "@convex-dev/agent";
import { components } from "../../../_generated/api";
import { SUPPORT_AGENT_PROMPT } from "../prompts";
import { search } from "../tools/search";
import { escalateConversation } from "../tools/escalateConversation";
import { resolveConversation } from "../tools/resolveConversation";

export const supportAgent = new Agent(components.agent, {
  chat: openai.chat("gpt-4o-mini"),
  instructions: SUPPORT_AGENT_PROMPT,
  tools: {
    searchTool: search,
    escalateConversationTool: escalateConversation,
    resolveConversationTool: resolveConversation,
  },
  maxSteps: 5,
});
