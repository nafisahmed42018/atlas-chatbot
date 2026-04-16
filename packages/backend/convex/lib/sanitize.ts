const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_BLOCK_REGEX = /<script[\s\S]*?<\/script>/gi;

// Common prompt injection / jailbreak patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i,
  /forget\s+(everything|all|your|previous)/i,
  /you\s+are\s+now\b/i,
  /act\s+as\s+(a|an)\s+/i,
  /\[system\]/i,
  /<system>/i,
  /new\s+instructions\s*:/i,
  /disregard\s+(all\s+)?(previous|above|prior)/i,
  /override\s+(previous\s+)?(instructions|commands|prompt)/i,
  /jailbreak/i,
  /do\s+anything\s+now/i,
  /dan\s+mode/i,
];

type SanitizeResult =
  | { valid: true; value: string }
  | { valid: false; reason: string };

export function sanitizeName(name: string): SanitizeResult {
  const trimmed = name.trim();

  if (!trimmed) return { valid: false, reason: "Name is required" };
  if (trimmed.length > 16)
    return { valid: false, reason: "Name must be 16 characters or less" };
  if (!/^[a-zA-Z\s'\-]+$/.test(trimmed))
    return {
      valid: false,
      reason: "Name can only contain letters, spaces, hyphens, and apostrophes",
    };

  return { valid: true, value: trimmed };
}

export function sanitizeEmail(email: string): SanitizeResult {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) return { valid: false, reason: "Email is required" };
  if (trimmed.length > 254)
    return { valid: false, reason: "Email address is too long" };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!EMAIL_REGEX.test(trimmed))
    return { valid: false, reason: "Invalid email address" };

  return { valid: true, value: trimmed };
}

export function sanitizeMessage(prompt: string): SanitizeResult {
  if (!prompt.trim()) return { valid: false, reason: "Message is required" };
  if (prompt.length > 500)
    return { valid: false, reason: "Message is too long (max 500 characters)" };

  // Strip script blocks and HTML tags
  const stripped = prompt
    .replace(SCRIPT_BLOCK_REGEX, "")
    .replace(HTML_TAG_REGEX, "")
    .trim();

  if (!stripped) return { valid: false, reason: "Message is required" };

  // Block prompt injection attempts
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(stripped)) {
      return { valid: false, reason: "Message contains prohibited content" };
    }
  }

  return { valid: true, value: stripped };
}
