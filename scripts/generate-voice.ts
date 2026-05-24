/**
 * Pre-generates static voice files for all fixed phrases (quiz questions,
 * welcome, transitions). Run from a non-blocked IP (your laptop):
 *
 *   npx tsx scripts/generate-voice.ts
 *
 * Output goes to client/public/voice/*.mp3 — Vite serves them at /voice/*.mp3
 * with zero runtime API cost.
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { synthesize } from "../server/elevenlabs";
import { createHash } from "node:crypto";

const PHRASES: string[] = [
  // Quiz welcome
  "Hi, I'm NOVA. I'll help you build your style profile. Let's start with a few questions about you.",
  // Quiz questions (must match QUESTIONS[].novaText in client/src/pages/style-quiz.tsx)
  "When you walk into a room feeling completely yourself — what one word describes that version of you?",
  "What's your honest relationship with getting dressed in the morning?",
  "What do you most want people to feel when they first encounter you? Pick all that apply.",
  "When you feel most confident, what are you typically wearing?",
  "When you're at your best — which of these is closest to how you show up?",
  "Your frame — this helps me recommend silhouettes that work with you, not against you.",
  "What color palette feels most like you — or what you want to project?",
  "What world do you operate in?",
  "And your typical day looks like...",
  "What's your investment range per piece? There's no wrong answer — this is about what feels right for you.",
  "Last one — what are you actually dressing for right now? I'll build your first recommendation around this.",
  // Quiz transitions
  "Got everything I need. Building your first recommendation now.",
  "Your first look is ready.",
  // NOVA drawer welcome
  "I'm NOVA. Ask me anything about what to wear.",
];

function phraseHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

async function main() {
  const outDir = join(process.cwd(), "client", "public", "voice");
  mkdirSync(outDir, { recursive: true });

  const manifest: Record<string, string> = {};

  for (const text of PHRASES) {
    const hash = phraseHash(text);
    const file = `${hash}.mp3`;
    console.log(`generating: ${text.slice(0, 60)}...`);
    const mp3 = await synthesize({ text });
    writeFileSync(join(outDir, file), mp3);
    manifest[text] = `/voice/${file}`;
    console.log(`  -> ${file} (${mp3.length} bytes)`);
  }

  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. ${PHRASES.length} files written to ${outDir}`);
  console.log("Commit them: git add client/public/voice && git commit");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
