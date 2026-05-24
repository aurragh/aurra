import Anthropic from "@anthropic-ai/sdk";
import Replicate from "replicate";
import type { StyleProfile } from "../shared/schema";
import { aurraSystemPrompt } from "./aurraSystemPrompt";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";

// System block with prompt caching — used in 3 call sites.
const aurraSystem: Anthropic.TextBlockParam[] = [
  {
    type: "text",
    text: aurraSystemPrompt,
    cache_control: { type: "ephemeral" },
  },
];

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// Strip ```json fences if the model wraps the response.
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

async function makeAurraAPICall(userPrompt: string): Promise<any> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: aurraSystem,
    messages: [
      {
        role: "user",
        content: `${userPrompt}\n\nRespond with valid JSON only, no markdown fences, no preamble.`,
      },
    ],
  });

  return parseJsonResponse(extractText(response));
}

export async function generateOutfitRecommendations(
  profile: StyleProfile,
  occasion: string,
  count: number = 1,
): Promise<GeneratedOutfit[]> {
  try {
    const personality = profile.personality ? JSON.parse(profile.personality) : {};
    const colorPrefs = profile.colorPreferences ? JSON.parse(profile.colorPreferences) : [];
    const stylePrefs = profile.stylePreferences ? JSON.parse(profile.stylePreferences) : [];
    const lifestyle = profile.lifestyle ? JSON.parse(profile.lifestyle) : {};

    const impressionGoals = personality.impressionGoals
      ? JSON.parse(personality.impressionGoals).join(", ")
      : "";
    const intentMoments = personality.intentMoments
      ? JSON.parse(personality.intentMoments).join(", ")
      : "";

    const userPrompt = `
User Psychological Profile:
- Identity word (how they describe themselves at their best): ${personality.identityWord || "not specified"}
- Dressing relationship: ${personality.dressingRelationship || "not specified"}
- Impression goals (what they want others to feel): ${impressionGoals || "not specified"}
- Confidence trigger (what they wear when most confident): ${personality.confidenceTrigger || "not specified"}
- Presence archetype: ${personality.presenceArchetype || personality.presenceGoal || "not specified"}

Physical & Practical:
- Body Type: ${profile.bodyType || "not specified"}
- Budget: ${profile.budget || "not specified"}
- Color Palette: ${colorPrefs.join(", ") || "not specified"}
- Industry: ${lifestyle.industry || "not specified"}
- Daily Routine: ${lifestyle.dailyRoutine || "not specified"}

Situation:
- Occasion: ${occasion}
- Key moments where presence matters: ${intentMoments || occasion}
`;

    let result: any;
    try {
      result = await makeAurraAPICall(userPrompt);
    } catch (parseError: any) {
      if (parseError instanceof SyntaxError || parseError.message?.includes("JSON")) {
        console.log("Aurra: JSON parsing failed, retrying once...");
        result = await makeAurraAPICall(userPrompt);
      } else {
        throw parseError;
      }
    }

    if (!result.primary || !result.backup || !result.avoid) {
      console.log("Aurra: Some required fields missing, using fallbacks for empty fields");
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
    console.error("Aurra AI error:", error);
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
  basicItems: string,
  occasion: string,
): Promise<string | null> {
  const itemsDesc = basicItems || "stylish outfit";
  const imagePrompt = `Professional fashion photography: complete outfit flat lay on pure white background. Items: ${itemsDesc} for ${occasion}. Vertically arranged: top garment at top, bottom garment in middle, shoes at bottom, accessories around. High-end fashion catalog aesthetic, crisp studio lighting, editorial quality. Ultra sharp focus, luxury brand photography. No models, no mannequins, no hangers.`;

  console.log(`Replicate Image Prompt: ${imagePrompt}`);

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
      console.log(`Replicate image generated: ${url}`);
      return url || null;
    }
    return null;
  } catch (error: any) {
    console.error("Replicate API error:", error);
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
    console.error("Image generation error:", error);
    return null;
  }
}

export async function analyzeStyleProfile(profileData: any): Promise<string> {
  try {
    const prompt = `Analyze this style profile and provide personalized fashion insights:

Profile Data: ${JSON.stringify(profileData)}

Provide a comprehensive style analysis including:
1. Personal style summary
2. Color palette recommendations
3. Key styling tips
4. Shopping recommendations
5. Style evolution suggestions

Respond with insightful, actionable advice in a friendly, expert tone.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system:
        "You are a professional fashion consultant providing personalized style advice.",
      messages: [{ role: "user", content: prompt }],
    });

    return (
      extractText(response) ||
      "Your style profile shows great potential for fashion exploration."
    );
  } catch (error) {
    console.error("Style analysis error:", error);
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
  profileContext?: string,
): Promise<ShoppingItem[]> {
  try {
    const outfitDescription = [
      `Primary look: ${primaryRecommendation}`,
      backupRecommendation ? `Backup look: ${backupRecommendation}` : "",
      `Occasion: ${occasion}`,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: `You are a fashion shopping assistant. Given an outfit description, identify 4-5 specific shoppable clothing or accessory pieces.
For each piece return a targeted search query that would find it on a shopping site.
Return JSON only (no markdown fences): { "items": [{ "name": string, "description": string, "category": string, "searchQuery": string }] }
Categories: Top, Bottom, Shoes, Outerwear, Accessory, Bag.
Keep descriptions concise and search queries specific (include color, material, silhouette where mentioned).`,
      messages: [
        {
          role: "user",
          content: `Extract shoppable items from this outfit description:\n\n${outfitDescription}\n\nRespond with valid JSON only.`,
        },
      ],
    });

    const text = extractText(response);
    if (!text) return [];
    const parsed = parseJsonResponse(text);
    const items = parsed.items || [];
    console.log(`Text-based extraction: found ${items.length} shopping items`);
    return items;
  } catch (error) {
    console.error("Text-based shopping extraction error:", error);
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
      const impressionGoals = personality.impressionGoals
        ? JSON.parse(personality.impressionGoals)
        : [];
      profileContext = `
User Style Profile:
- Identity: ${personality.identityWord || "not set"}
- Presence archetype: ${personality.presenceArchetype || "not set"}
- Confidence trigger: ${personality.confidenceTrigger || "not set"}
- Impression goals: ${impressionGoals.join(", ") || "not set"}
- Body type: ${profile.bodyType || "not set"}
- Color palette: ${colorPrefs[0] || "not set"}
- Budget: ${profile.budget || "not set"}
- Industry: ${lifestyle.industry || "not set"}
- Daily routine: ${lifestyle.dailyRoutine || "not set"}
`;
    }

    const novaSystem: Anthropic.TextBlockParam[] = [
      {
        type: "text",
        text: aurraSystemPrompt,
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: `${
          profileContext
            ? `ACTIVE USER PROFILE:\n${profileContext}\nUse this profile to ground your answers in the user's specific identity, presence archetype, and context.`
            : "No profile available — give general decisive advice."
        }

CONVERSATIONAL MODE:
This is a chat. Respond in 2-4 short sentences max. Be direct and decisive.
Do not use JSON format. Respond in plain text.
Sound like a trusted advisor, not a chatbot.`,
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
    console.error("NOVA chat error:", error);
    return "I'm unavailable right now. Try again in a moment.";
  }
}

export async function generateTryOnImage(
  avatarPhotoUrl: string,
  outfitText: string,
  occasion: string,
): Promise<string | null> {
  try {
    console.log(`Generating try-on image for occasion: ${occasion}`);

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
      console.log(`Try-on image generated: ${url}`);
      return url || null;
    }
    return null;
  } catch (error: any) {
    console.error("Try-on generation error:", error);
    return null;
  }
}
