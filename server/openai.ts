import Anthropic from "@anthropic-ai/sdk";
import Replicate from "replicate";
import type { StyleProfile } from "../shared/schema";
import {
  SYSTEM_AURRA,
  renderOutfitPrompt,
  renderNovaSystemAppend,
  renderShoppingExtraction,
  renderStyleAnalysis,
  renderOutfitImagePrompt,
  renderTryOnPrompt,
  type OutfitVars,
} from "../prompts/index";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";

// Cached Aurra base system prompt. Cached with ephemeral to make repeat calls ~10x cheaper.
const aurraSystemBlock: Anthropic.TextBlockParam[] = [
  {
    type: "text",
    text: SYSTEM_AURRA,
    cache_control: { type: "ephemeral" },
  },
];

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function parseJsonResponse(text: string): any {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return JSON.parse(fenceMatch ? fenceMatch[1] : trimmed);
}

interface OutfitItem {
  category: string;
  description: string;
  color: string;
  style: string;
  brand_suggestions?: string[];
  price_range?: string;
}

interface GeneratedOutfit {
  primary: string;
  backup: string;
  avoid: string;
  why: string;
  name: string;
  description: string;
  items: string;
  aiRecommendation: string;
}

/** Build the OutfitVars object directly from a StyleProfile row. Single source of truth for the quiz → LLM mapping. */
function buildOutfitVars(profile: StyleProfile, occasion: string): OutfitVars {
  const personality = profile.personality ? JSON.parse(profile.personality) : {};
  const colorPrefs = profile.colorPreferences ? JSON.parse(profile.colorPreferences) : [];
  const lifestyle = profile.lifestyle ? JSON.parse(profile.lifestyle) : {};
  const appearance = (profile as any).appearance ? JSON.parse((profile as any).appearance) : {};
  const styleDetails = (profile as any).styleDetails ? JSON.parse((profile as any).styleDetails) : {};

  const impressionGoals = personality.impressionGoals
    ? JSON.parse(personality.impressionGoals).join(", ")
    : "";
  const intentMoments = personality.intentMoments
    ? JSON.parse(personality.intentMoments).join(", ")
    : "";

  return {
    // Phase 1
    identityWord: personality.identityWord,
    dressingRelationship: personality.dressingRelationship,
    impressionGoals,
    confidenceTrigger: personality.confidenceTrigger,
    emotionalGoal: personality.emotionalGoal,
    // Phase 2 — presence + body
    presenceArchetype: personality.presenceArchetype || personality.presenceGoal,
    bodyType: profile.bodyType ?? undefined,
    gender: appearance.gender,
    height: appearance.height,
    skinUndertone: appearance.skinUndertone,
    hairColor: appearance.hairColor,
    eyeColor: appearance.eyeColor,
    faceShape: appearance.faceShape,
    // Phase 2 — style depth
    colorPalette: colorPrefs.join(", "),
    colorComfort: styleDetails.colorComfort,
    accessories: styleDetails.accessories,
    fabric: styleDetails.fabric,
    industry: lifestyle.industry,
    dailyRoutine: lifestyle.dailyRoutine,
    // Phase 3
    budget: profile.budget ?? undefined,
    sustainability: (profile as any).sustainability ?? undefined,
    occasion,
    intentMoments: intentMoments || occasion,
  };
}

async function callAurra(userPrompt: string): Promise<any> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: aurraSystemBlock,
    messages: [{ role: "user", content: userPrompt }],
  });

  console.log(
    `[aurra] usage in=${response.usage.input_tokens} out=${response.usage.output_tokens} cache_read=${response.usage.cache_read_input_tokens ?? 0} cache_write=${response.usage.cache_creation_input_tokens ?? 0}`,
  );

  return parseJsonResponse(extractText(response));
}

export async function generateOutfitRecommendations(
  profile: StyleProfile,
  occasion: string,
  count: number = 1,
): Promise<GeneratedOutfit[]> {
  try {
    const vars = buildOutfitVars(profile, occasion);
    const userPrompt = renderOutfitPrompt(vars);

    console.log(`[aurra] generating outfit. Vars:`, JSON.stringify(vars));

    let result: any;
    try {
      result = await callAurra(userPrompt);
    } catch (parseError: any) {
      if (parseError instanceof SyntaxError || parseError.message?.includes("JSON")) {
        console.log("[aurra] JSON parse failed, retrying once");
        result = await callAurra(userPrompt);
      } else {
        throw parseError;
      }
    }

    if (!result.primary || !result.backup || !result.avoid) {
      console.warn("[aurra] response missing required fields, using fallbacks", result);
    }

    // Structured items power the image generator. If Aurra didn't return them
    // (older prompt rev, parse hiccup, etc), store an empty object — the image
    // step will fall back to using the prose `primary`.
    const structured =
      result.items && typeof result.items === "object" && !Array.isArray(result.items)
        ? {
            top: typeof result.items.top === "string" ? result.items.top : null,
            bottom: typeof result.items.bottom === "string" ? result.items.bottom : null,
            shoes: typeof result.items.shoes === "string" ? result.items.shoes : null,
            bag: typeof result.items.bag === "string" ? result.items.bag : null,
            accessory:
              typeof result.items.accessory === "string" ? result.items.accessory : null,
          }
        : {};

    return [
      {
        primary: result.primary || "",
        backup: result.backup || "",
        avoid: result.avoid || "",
        why: result.why || "",
        name: "Aurra Recommendation",
        description: result.primary || "",
        items: JSON.stringify(structured),
        aiRecommendation: `WHY: ${result.why || ""}\n\nBACKUP: ${result.backup || ""}\n\nAVOID: ${result.avoid || ""}`,
      },
    ];
  } catch (error) {
    console.error("[aurra] outfit generation error:", error);
    return [
      {
        primary: "Default recommendation",
        backup: "Default backup",
        avoid: "Default avoid",
        why: "Error processing request",
        name: "Aurra Recommendation",
        description: "Default recommendation",
        items: JSON.stringify([]),
        aiRecommendation: "Error processing request",
      },
    ];
  }
}

async function generateWithReplicate(
  itemsList: string,
  occasion: string,
  aestheticMood: string,
  paletteAnchor: string,
): Promise<string | null> {
  const imagePrompt = renderOutfitImagePrompt({
    itemsList,
    occasion,
    aestheticMood,
    paletteAnchor,
  });

  console.log(`[replicate] image prompt:\n${imagePrompt}`);

  try {
    const output = await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: imagePrompt,
        num_outputs: 1,
        aspect_ratio: "9:16",
        output_format: "webp",
        output_quality: 90,
        go_fast: true,
      },
    });

    const outputArray = output as any[];
    if (outputArray && outputArray.length > 0) {
      const url = outputArray[0]?.url ? outputArray[0].url() : String(outputArray[0]);
      console.log(`[replicate] image generated: ${url}`);
      return url || null;
    }
    return null;
  } catch (error: any) {
    console.error("[replicate] error:", error);
    return null;
  }
}

/**
 * Build the bullet list passed to Flux. Each line starts with "ONE" so the
 * model has explicit cardinality at every item. Null fields are skipped so
 * Flux is never given an empty slot to fill in with extras.
 */
function buildItemsList(structured: Record<string, string | null>): string {
  const lines: string[] = [];
  if (structured.top) lines.push(`- ONE top: ${structured.top}`);
  if (structured.bottom) lines.push(`- ONE bottom: ${structured.bottom}`);
  if (structured.shoes) lines.push(`- ONE pair of shoes: ${structured.shoes}`);
  if (structured.bag) lines.push(`- ONE bag: ${structured.bag}`);
  if (structured.accessory) lines.push(`- ONE accessory: ${structured.accessory}`);
  return lines.join("\n");
}

/**
 * Derive the aesthetic mood phrase from the user's profile.
 * Maps identity + presence + emotional goal to a short visual descriptor that
 * tells Flux *how* to feel, not what to render.
 */
function buildAestheticMood(profile: StyleProfile): string {
  const personality = safeJson<Record<string, any>>(profile.personality, {});
  const identity = String(personality.identityWord || "").toLowerCase();
  const presence = String(personality.presenceArchetype || personality.presenceGoal || "").toLowerCase();
  const emotion = String(personality.emotionalGoal || "").toLowerCase();

  const identityMood: Record<string, string> = {
    powerful: "commanding restrained authority",
    sharp: "sharp structured precision",
    quiet: "quiet grounded confidence",
    bold: "deliberate bold composure",
    warm: "warm approachable presence",
    grounded: "grounded composed presence",
  };

  const archetypeBeat: Record<string, string> = {
    "commands silence": "with negative space and weight",
    "draws people in": "with softness and welcoming warmth",
    "reads the room": "with neutral readability",
    "gets things done": "with utility and clean function",
  };

  const emotionTexture: Record<string, string> = {
    powerful: "elevated luxury finish",
    calm: "softly composed finish",
    warm: "warm magazine finish",
    grounded: "natural editorial finish",
    creative: "considered editorial finish",
    playful: "polished editorial finish",
  };

  const mood = identityMood[identity] || "considered editorial confidence";
  const beat = archetypeBeat[presence] || "with confident balance";
  const texture = emotionTexture[emotion] || "premium catalog finish";
  return `${mood} ${beat}, ${texture}`;
}

/**
 * Derive the palette anchor phrase. Tells Flux the color world the outfit
 * sits in — used as a colour-grading hint, not a replacement for the items'
 * own colours (those are still authoritative).
 */
function buildPaletteAnchor(profile: StyleProfile): string {
  const colorPrefs = safeJson<string[]>(profile.colorPreferences, []);
  const palette = String(colorPrefs[0] || "").toLowerCase();
  const appearance = safeJson<Record<string, any>>((profile as any).appearance, {});
  const undertone = String(appearance.skinUndertone || "").toLowerCase();

  const paletteBase: Record<string, string> = {
    neutral: "cool-toned neutrals, deep charcoal and stone foundation",
    classic: "classic deep neutrals, midnight navy and oxblood accents",
    warm: "warm earthy palette with cream and camel anchors",
    bold: "saturated deep colour story, jewel-tone accents grounded in black",
    minimal: "monochrome editorial greyscale with crisp white space",
    soft: "softly muted palette, dusty pastels grounded in cool grey",
  };

  let base = paletteBase[palette] || "considered neutral palette with restrained accents";
  if (undertone.includes("cool")) base += ", cool white balance";
  else if (undertone.includes("warm")) base += ", subtly warm white balance";
  return base;
}

function safeJson<T>(input: string | null | undefined, fallback: T): T {
  if (!input) return fallback;
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

export async function generateOutfitImage(
  outfit: GeneratedOutfit,
  profile: StyleProfile,
  occasion: string,
): Promise<string | null> {
  try {
    const aestheticMood = buildAestheticMood(profile);
    const paletteAnchor = buildPaletteAnchor(profile);

    const parsed = JSON.parse(outfit.items || "{}") as Record<string, string | null>;
    // New path: structured items from the LLM. If we have at least a top + bottom,
    // build the constrained list.
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && (parsed.top || parsed.bottom)) {
      const itemsList = buildItemsList(parsed);
      return await generateWithReplicate(itemsList, occasion, aestheticMood, paletteAnchor);
    }

    // Legacy/fallback path: no structured items, fall back to the prose `primary`
    // wrapped as a single line. Still cardinality-locked via the "ONE" prefix.
    const fallback = outfit.primary
      ? `- ONE complete outfit as described: ${outfit.primary}`
      : "- ONE outfit appropriate to the occasion, no duplicates";
    return await generateWithReplicate(fallback, occasion, aestheticMood, paletteAnchor);
  } catch (error: any) {
    console.error("[replicate] outfit image error:", error);
    return null;
  }
}

export async function analyzeStyleProfile(profileData: any): Promise<string> {
  try {
    const { system, user } = renderStyleAnalysis(JSON.stringify(profileData));

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    });

    return (
      extractText(response) || "Your style profile shows great potential for fashion exploration."
    );
  } catch (error) {
    console.error("[aurra] style analysis error:", error);
    return "Complete your style profile to receive personalized fashion insights and recommendations.";
  }
}

export interface ShoppingItem {
  name: string;
  description: string;
  category: string;
  searchQuery: string;
}

export async function extractShoppingItemsFromText(
  primaryRecommendation: string,
  backupRecommendation: string,
  occasion: string,
): Promise<ShoppingItem[]> {
  try {
    const { system, user } = renderShoppingExtraction({
      primaryRecommendation,
      backupRecommendation,
      occasion,
    });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text = extractText(response);
    if (!text) return [];
    const parsed = parseJsonResponse(text);
    const items = parsed.items || [];
    console.log(`[aurra] shopping extraction: ${items.length} items`);
    return items;
  } catch (error) {
    console.error("[aurra] shopping extraction error:", error);
    return [];
  }
}

export async function novaChatResponse(
  message: string,
  profile: StyleProfile | null,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  try {
    let profileContext = "";
    if (profile) {
      const personality = profile.personality ? JSON.parse(profile.personality) : {};
      const lifestyle = profile.lifestyle ? JSON.parse(profile.lifestyle) : {};
      const colorPrefs = profile.colorPreferences ? JSON.parse(profile.colorPreferences) : [];
      const impressionGoals = personality.impressionGoals ? JSON.parse(personality.impressionGoals) : [];
      profileContext = [
        `- Identity: ${personality.identityWord || "not set"}`,
        `- Presence archetype: ${personality.presenceArchetype || "not set"}`,
        `- Confidence trigger: ${personality.confidenceTrigger || "not set"}`,
        `- Impression goals: ${impressionGoals.join(", ") || "not set"}`,
        `- Body type: ${profile.bodyType || "not set"}`,
        `- Color palette: ${colorPrefs[0] || "not set"}`,
        `- Budget: ${profile.budget || "not set"}`,
        `- Industry: ${lifestyle.industry || "not set"}`,
        `- Daily routine: ${lifestyle.dailyRoutine || "not set"}`,
      ].join("\n");
    }

    const novaSystem: Anthropic.TextBlockParam[] = [
      {
        type: "text",
        text: SYSTEM_AURRA,
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: renderNovaSystemAppend(profileContext),
      },
    ];

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: message },
    ];

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: novaSystem,
      messages,
    });

    return extractText(response) || "I'm not sure — try rephrasing your question.";
  } catch (error) {
    console.error("[aurra] NOVA chat error:", error);
    return "I'm unavailable right now. Try again in a moment.";
  }
}

export async function generateTryOnImage(
  avatarPhotoUrl: string,
  outfitText: string,
  occasion: string,
  profile?: StyleProfile,
): Promise<string | null> {
  try {
    console.log(`[replicate] try-on for occasion: ${occasion}`);

    const aestheticMood = profile
      ? buildAestheticMood(profile)
      : "considered editorial confidence with restrained authority, premium catalog finish";

    const { prompt, negativePrompt } = renderTryOnPrompt({
      outfitText,
      occasion,
      aestheticMood,
    });

    const output = (await replicate.run(
      "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
      {
        input: {
          prompt,
          input_image: avatarPhotoUrl,
          num_outputs: 1,
          style_name: "Photographic (Default)",
          style_strength_ratio: 15,
          num_steps: 30,
          guidance_scale: 5,
          negative_prompt: negativePrompt,
        },
      },
    )) as any[];

    if (output && output.length > 0) {
      const url = output[0]?.url ? output[0].url() : String(output[0]);
      console.log(`[replicate] try-on image generated: ${url}`);
      return url || null;
    }
    return null;
  } catch (error: any) {
    console.error("[replicate] try-on error:", error);
    return null;
  }
}
