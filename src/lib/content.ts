import { db } from "@/lib/db";

/** Fetch all website content blocks as a key→value map (server-side). */
export async function getWebsiteContent(): Promise<Record<string, string>> {
  const blocks = await db.websiteContent.findMany();
  const obj: Record<string, string> = {};
  for (const b of blocks) obj[b.id] = b.value;
  return obj;
}

/** Get a single block with a fallback default. */
export async function getContent(key: string, fallback = ""): Promise<string> {
  const block = await db.websiteContent.findUnique({ where: { id: key } });
  return block?.value ?? fallback;
}
