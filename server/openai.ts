import Anthropic from "@anthropic-ai/sdk";
import Replicate from "replicate";
import type { StyleProfile } from "../shared/schema";
import {
  SYSTEM_AURRA,
  renderOutfitPrompt,
  renderNovaSystemAppend,
  renderShoppingExtraction,
  renderStyleAnalysis,
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

  const impressionGoals = personality.impressionGoals
    ? JSON.parse(personality.impressionGoals).join(", ")
    : "";
  const intentMoments = personality.intentMoments
    ? JSON.parse(personality.intentMoments).join(", ")
    : "";

  return {
    identityWord: personality.identityWord,
    dressingRelationship: personality.dressingRelationship,
    impressionGoals,
    confidenceTrigger: personality.confidenceTrigger,
    presenceArchetype: personality.presenceArchetype || personality.presenceGoal,
    bodyType: profile.bodyType ?? undefined,
    colorPalette: colorPrefs.join(", "),
    industry: lifestyle.industry,
    dailyRoutine: lifestyle.dailyRoutine,
    budget: profile.budget ?? undefined,
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

    return [
      {
        primary: result.primary || "",
        backup: result.backup || "",
        avoid: result.avoid || "",
        why: result.why || "",
        name: "Aurra Recommendation",
        description: result.primary || "",
        items: JSON.stringify([
          {
            category: "Recommendation",
            description: result.primary,
            color: "N/A",
            style: "N/A",
          },
        ]),
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

async function generateWithReplicate(basicItems: string, occasion: string): Promise<string | null> {
  const itemsDesc = basicItems || "stylish outfit";
  const imagePrompt = `Professional fashion photography: complete outfit flat lay on pure white background. Items: ${itemsDesc} for ${occasion}. Vertically arranged: top garment at top, bottom garment in middle, shoes at bottom, accessories around. High-end fashion catalog aesthetic, crisp studio lighting, editorial quality. Ultra sharp focus, luxury brand photography. No models, no mannequins, no hangers.`;

  console.log(`[replicate] image prompt: ${imagePrompt}`);

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

export async function generateOutfitImage(
  outfit: GeneratedOutfit,
  profile: StyleProfile,
  occasion: string,
): Promise<string | null> {
  try {
    const items = JSON.parse(outfit.items || "[]") as OutfitItem[];
    const allItems = items
      .map((item) => `${item.color} ${item.category.toLowerCase()}`)
      .join(", ");
    return await generateWithReplicate(allItems || outfit.primary, occasion);
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
): Promise<string | null> {
  try {
    console.log(`[replicate] try-on for occasion: ${occasion}`);

    const prompt = `a photo of a woman img, wearing ${outfitText}, full body outfit shot, professional fashion editorial photography, clean studio background, sharp focus, high-end fashion magazine quality`;

    const output = (await replicate.run(
      "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
      {
        input: {
          prompt,
          input_image: avatarPhotoUrl,
          num_outputs: 1,
          style_name: "Photographic (Default)",
          style_strength_ratio: 20,
          num_steps: 20,
          negative_prompt:
            "nsfw, cartoon, illustration, painting, deformed, bad anatomy, ugly, blurry",
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
