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

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/csv",
  "text/plain",
]);

// Max file size: 10 MB
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type SanitizeResult =
  | { valid: true; value: string }
  | { valid: false; reason: string };

// ─── Text helpers ────────────────────────────────────────────────────────────

function stripHtml(value: string): string {
  return value.replace(SCRIPT_BLOCK_REGEX, "").replace(HTML_TAG_REGEX, "");
}

// ─── Exported sanitizers ─────────────────────────────────────────────────────

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

// Widget visitor message → goes to AI, injection blocking required
export function sanitizeMessage(prompt: string): SanitizeResult {
  if (!prompt.trim()) return { valid: false, reason: "Message is required" };
  if (prompt.length > 500)
    return { valid: false, reason: "Message is too long (max 500 characters)" };

  const stripped = stripHtml(prompt).trim();

  if (!stripped) return { valid: false, reason: "Message is required" };

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(stripped)) {
      return { valid: false, reason: "Message contains prohibited content" };
    }
  }

  return { valid: true, value: stripped };
}

// Authenticated operator message → displayed to user, not sent to AI directly
export function sanitizeOperatorMessage(prompt: string): SanitizeResult {
  if (!prompt.trim()) return { valid: false, reason: "Message is required" };
  if (prompt.length > 2000)
    return { valid: false, reason: "Message is too long (max 2000 characters)" };

  const stripped = stripHtml(prompt).trim();

  if (!stripped) return { valid: false, reason: "Message is required" };

  return { valid: true, value: stripped };
}

// Operator prompt sent to AI for enhancement — injection blocking required
export function sanitizeEnhancePrompt(prompt: string): SanitizeResult {
  if (!prompt.trim()) return { valid: false, reason: "Prompt is required" };
  if (prompt.length > 2000)
    return { valid: false, reason: "Prompt is too long (max 2000 characters)" };

  const stripped = stripHtml(prompt).trim();

  if (!stripped) return { valid: false, reason: "Prompt is required" };

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(stripped)) {
      return { valid: false, reason: "Prompt contains prohibited content" };
    }
  }

  return { valid: true, value: stripped };
}

export function sanitizeFilename(filename: string): SanitizeResult {
  const trimmed = filename.trim();

  if (!trimmed) return { valid: false, reason: "Filename is required" };
  if (trimmed.length > 100)
    return { valid: false, reason: "Filename must be 100 characters or less" };

  // Block path traversal and shell-unsafe characters
  if (/[/\\<>:"|?*\x00-\x1f]/.test(trimmed) || trimmed.includes(".."))
    return { valid: false, reason: "Filename contains invalid characters" };

  // Must have a recognised extension
  const ext = trimmed.split(".").pop()?.toLowerCase();
  if (!ext || !["pdf", "csv", "txt"].includes(ext))
    return { valid: false, reason: "Only .pdf, .csv, and .txt files are allowed" };

  return { valid: true, value: trimmed };
}

export function sanitizeCategory(category: string): SanitizeResult {
  const trimmed = category.trim();

  if (!trimmed) return { valid: false, reason: "Category is required" };
  if (trimmed.length > 50)
    return { valid: false, reason: "Category must be 50 characters or less" };
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed))
    return {
      valid: false,
      reason: "Category can only contain letters, numbers, spaces, hyphens, and underscores",
    };

  return { valid: true, value: trimmed };
}

export function sanitizeMimeType(mimeType: string): SanitizeResult {
  const trimmed = mimeType.trim().toLowerCase();

  if (!trimmed) return { valid: false, reason: "File type is required" };
  if (!ALLOWED_MIME_TYPES.has(trimmed))
    return { valid: false, reason: `File type "${trimmed}" is not allowed` };

  return { valid: true, value: trimmed };
}

export function sanitizeFileSize(sizeBytes: number): SanitizeResult {
  if (sizeBytes <= 0)
    return { valid: false, reason: "File is empty" };
  if (sizeBytes > MAX_FILE_SIZE_BYTES)
    return { valid: false, reason: "File must be 10 MB or smaller" };

  return { valid: true, value: String(sizeBytes) };
}

// Strips HTML from browser-collected metadata strings (userAgent, referrer, etc.)
export function sanitizeMetadataString(value: string): string {
  return stripHtml(value).trim().slice(0, 500);
}
