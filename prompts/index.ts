/**
 * Prompt registry. Loads .md files from prompts/ at startup and exposes
 * render(name, vars) that interpolates {{vars}} into the template.
 *
 * Single source of truth — server/openai.ts pulls all its strings from here.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Resolve from repo root (process.cwd()) so this works in both `tsx` dev and bundled prod.
const PROMPTS_DIR = join(process.cwd(), "prompts");

function load(relPath: string): string {
  return readFileSync(join(PROMPTS_DIR, relPath), "utf8");
}

const SYSTEM_AURRA_RAW = load("system/aurra-stylist.md");
const TPL_OUTFIT = load("templates/outfit-recommendation.md");
const TPL_NOVA = load("templates/nova-chat.md");
const TPL_SHOPPING = load("templates/shopping-extraction.md");
const TPL_ANALYSIS = load("templates/style-analysis.md");
const TPL_OUTFIT_IMAGE = load("templates/outfit-image.md");
const TPL_TRYON = load("templates/try-on.md");

/** Strip the markdown front-matter header (everything before the first `---` separator after the title). */
function stripHeader(md: string): string {
  const parts = md.split(/^---\s*$/m);
  return parts.length > 1 ? parts.slice(1).join("---").trim() : md.trim();
}

export const SYSTEM_AURRA = stripHeader(SYSTEM_AURRA_RAW);

/** Replace `{{key}}` occurrences. Missing keys render as empty string and warn. */
function render(template: string, vars: Record<string, string | number | undefined | null>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    if (val === undefined || val === null || val === "") {
      return "not specified";
    }
    return String(val);
  });
}

export interface OutfitVars {
  // Phase 1 — psychological signature
  identityWord?: string;
  dressingRelationship?: string;
  impressionGoals?: string;
  confidenceTrigger?: string;
  emotionalGoal?: string;
  // Phase 2 — presence + appearance
  presenceArchetype?: string;
  bodyType?: string;
  gender?: string;
  height?: string;
  skinUndertone?: string;
  hairColor?: string;
  eyeColor?: string;
  faceShape?: string;
  // Phase 2 — style depth
  colorPalette?: string;
  colorComfort?: string;
  accessories?: string;
  fabric?: string;
  industry?: string;
  dailyRoutine?: string;
  // Phase 3 — decision
  budget?: string;
  sustainability?: string;
  occasion: string;
  intentMoments?: string;
}

export function renderOutfitPrompt(vars: OutfitVars): string {
  return render(stripHeader(TPL_OUTFIT), vars as Record<string, string>);
}

export function renderNovaSystemAppend(profileContext: string): string {
  return render(stripHeader(TPL_NOVA), { profileContext: profileContext || "(no profile yet)" });
}

export function renderShoppingExtraction(vars: {
  primaryRecommendation: string;
  backupRecommendation: string;
  occasion: string;
}): { system: string; user: string } {
  const body = stripHeader(TPL_SHOPPING);
  const [systemPart, userPart] = body.split(/^##\s*USER\s*$/m);
  return {
    system: render(systemPart.replace(/^##\s*SYSTEM\s*$/m, "").trim(), vars),
    user: render(userPart.trim(), vars),
  };
}

export function renderStyleAnalysis(profileJson: string): { system: string; user: string } {
  const body = stripHeader(TPL_ANALYSIS);
  const [systemPart, userPart] = body.split(/^##\s*USER\s*$/m);
  return {
    system: systemPart.replace(/^##\s*SYSTEM\s*$/m, "").trim(),
    user: render(userPart.trim(), { profileJson }),
  };
}

/** Extract the `## PROMPT` section body from a template .md file. */
function extractSection(md: string, header: string): string {
  const re = new RegExp(`##\\s*${header}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, "i");
  const m = md.match(re);
  return (m?.[1] ?? "").trim();
}

export function renderOutfitImagePrompt(vars: { itemsDesc: string; occasion: string }): string {
  const body = extractSection(TPL_OUTFIT_IMAGE, "PROMPT");
  return render(body, vars);
}

export function renderTryOnPrompt(vars: { outfitText: string; occasion: string }): {
  prompt: string;
  negativePrompt: string;
} {
  return {
    prompt: render(extractSection(TPL_TRYON, "PROMPT"), vars),
    negativePrompt: extractSection(TPL_TRYON, "NEGATIVE PROMPT"),
  };
}
