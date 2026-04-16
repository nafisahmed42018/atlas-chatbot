import { createClerkClient } from "@clerk/backend";
import { v } from "convex/values";
import { action, query } from "../_generated/server";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SK || "",
});

export const validate = action({
  args: {
    organizationId: v.string(),
  },
  handler: async (_, args) => {
    if (!args.organizationId) {
      return { valid: false, reason: "Organization ID is required" };
    }

    try {
      const organization = await clerkClient.organizations.getOrganization({
        organizationId: args.organizationId,
      });

      if (organization) {
        return { valid: true };
      }

      return { valid: false, reason: "Organization not found" };
    } catch {
      return { valid: false, reason: "Organization not found" };
    }
  },
});
