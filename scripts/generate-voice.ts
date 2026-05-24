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
  // Welcome
  "Hi, I'm Aurra. I'll help you build your style profile. Let's start with a few questions about you.",
  // Phase 1: Who You Are (5)
  "When you walk into a room feeling completely yourself, what one word describes that version of you?",
  "What's your honest relationship with getting dressed in the morning?",
  "What do you most want people to feel when they first encounter you? Pick all that apply.",
  "When you feel most confident, what are you typically wearing?",
  "When you walk out the door dressed right, what do you want to feel?",
  // Phase 2: How You Show Up (14)
  "When you're operating at your best, which of these is closest to how you actually show up?",
  "Your frame. This helps me recommend silhouettes that work with you, not against you.",
  "How would you like your outfits styled? This shapes the silhouettes I choose for you.",
  "Your height. This lets me balance proportions and recommend the right silhouette length.",
  "One more thing about you. What best describes your natural coloring?",
  "Your hair color. I use this to find colors that make you look your most vibrant.",
  "Your eye color. Some palettes make eyes pop, others mute them. I'll use this to your advantage.",
  "Your face shape. This guides necklines, collars, and accessories.",
  "Which color world feels most natural to you, or what you want to project?",
  "How far do you go with color, honestly?",
  "What's your relationship with accessories?",
  "Last detail. How do you feel about texture and fabric?",
  "What world do you operate in?",
  "And your typical day looks like.",
  // Phase 3: The Decision (3)
  "What's your investment range per piece?",
  "How important is sustainability to you when it comes to fashion?",
  "What are you dressing for right now? I'll build everything around this.",
  // Transitions
  "Got everything I need. Building your first recommendation now.",
  "Your first look is ready.",
  // Aurra drawer welcome
  "I'm Aurra. Ask me anything about what to wear.",
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
