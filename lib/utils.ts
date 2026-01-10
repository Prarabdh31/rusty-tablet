import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanMarkdown(content: string): string {
  if (!content) return "";

  let cleaned = content;

  // 1. Ensure newlines before Tables
  // Finds a line starting with | that follows a line WITHOUT | (and isn't empty)
  cleaned = cleaned.replace(/([^\n|])\n\|/g, '$1\n\n|');

  // 2. Ensure newlines before Lists (Bullets * or -)
  // Finds a line starting with * or - that follows a non-list line
  cleaned = cleaned.replace(/([^\n])\n([\*\-]) /g, '$1\n\n$2 ');

  // 3. Ensure newlines before Lists (Numbered 1.)
  cleaned = cleaned.replace(/([^\n])\n(\d+\.) /g, '$1\n\n$2 ');

  // 4. Ensure newlines before Headers (##)
  cleaned = cleaned.replace(/([^\n])\n(#{1,6}) /g, '$1\n\n$2 ');

  return cleaned;
}