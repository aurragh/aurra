import OpenAI from "openai";
import Replicate from "replicate";
import type { StyleProfile } from "@shared/schema";
import { aurraSystemPrompt } from "./aurraSystemPrompt";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key"
});

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
  // Legacy compatibility for frontend mapping
  name: string;
  description: string;
  items: string;
  aiRecommendation: string;
}

// Helper function to make API call and parse JSON response
async function makeAurraAPICall(userPrompt: string): Promise<any> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: aurraSystemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 1000,
  });

  const content = response.choices[0].message.content || '{}';
  return JSON.parse(content);
}

export async function generateOutfitRecommendations(
  profile: StyleProfile,
  occasion: string,
  count: number = 1
): Promise<GeneratedOutfit[]> {
  try {
    const personality = profile.personality ? JSON.parse(profile.personality) : {};
    const colorPrefs = profile.colorPreferences ? JSON.parse(profile.colorPreferences) : [];
    const stylePrefs = profile.stylePreferences ? JSON.parse(profile.stylePreferences) : [];
    const lifestyle = profile.lifestyle ? JSON.parse(profile.lifestyle) : {};

    // Parse richer psychological fields
    const impressionGoals = personality.impressionGoals
      ? JSON.parse(personality.impressionGoals).join(', ')
      : '';
    const intentMoments = personality.intentMoments
      ? JSON.parse(personality.intentMoments).join(', ')
      : '';

    const userPrompt = `
User Psychological Profile:
- Identity word (how they describe themselves at their best): ${personality.identityWord || 'not specified'}
- Dressing relationship: ${personality.dressingRelationship || 'not specified'}
- Impression goals (what they want others to feel): ${impressionGoals || 'not specified'}
- Confidence trigger (what they wear when most confident): ${personality.confidenceTrigger || 'not specified'}
- Presence archetype: ${personality.presenceArchetype || personality.presenceGoal || 'not specified'}

Physical & Practical:
- Body Type: ${profile.bodyType || 'not specified'}
- Budget: ${profile.budget || 'not specified'}
- Color Palette: ${colorPrefs.join(', ') || 'not specified'}
- Industry: ${lifestyle.industry || 'not specified'}
- Daily Routine: ${lifestyle.dailyRoutine || 'not specified'}

Situation:
- Occasion: ${occasion}
- Key moments where presence matters: ${intentMoments || occasion}
`;

    let result: any;
    
    // Guardrail: If JSON parsing fails, retry once automatically (per spec Doc 1, Section 6)
    try {
      result = await makeAurraAPICall(userPrompt);
    } catch (parseError: any) {
      // Only retry on JSON parsing errors, not all API errors
      if (parseError instanceof SyntaxError || parseError.message?.includes('JSON')) {
        console.log("Aurra: JSON parsing failed, retrying once...");
        result = await makeAurraAPICall(userPrompt);
      } else {
        throw parseError;
      }
    }

    // Log if required fields are missing (don't retry, just use fallbacks)
    if (!result.primary || !result.backup || !result.avoid) {
      console.log("Aurra: Some required fields missing, using fallbacks for empty fields");
    }
    
    // Map Aurra structure to existing Outfit schema for compatibility
    return [{
      primary: result.primary || "",
      backup: result.backup || "",
      avoid: result.avoid || "",
      why: result.why || "",
      name: "Aurra Recommendation",
      description: result.primary || "",
      items: JSON.stringify([{ category: "Recommendation", description: result.primary, color: "N/A", style: "N/A" }]),
      aiRecommendation: `WHY: ${result.why || ""}\n\nBACKUP: ${result.backup || ""}\n\nAVOID: ${result.avoid || ""}`
    }];

  } catch (error) {
    console.error("Aurra AI error:", error);
    return [{
      primary: "Default recommendation",
      backup: "Default backup",
      avoid: "Default avoid",
      why: "Error processing request",
      name: "Aurra Recommendation",
      description: "Default recommendation",
      items: JSON.stringify([]),
      aiRecommendation: "Error processing request"
    }];
  }
}

// Generate outfit images using Replicate (flux-schnell model)
async function generateWithReplicate(
  basicItems: string,
  occasion: string
): Promise<string | null> {
  const itemsDesc = basicItems || 'stylish outfit';

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
      }
    });

    // Output is an array of FileOutput objects
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
  occasion: string
): Promise<string | null> {
  try {
    const items = JSON.parse(outfit.items || '[]') as OutfitItem[];

    const allItems = items.map(item =>
      `${item.color} ${item.category.toLowerCase()}`
    ).join(', ');

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

    // Use the most reliable OpenAI model for style analysis
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system", 
          content: "You are a professional fashion consultant providing personalized style advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 800,
    });

    return response.choices[0].message.content || "Your style profile shows great potential for fashion exploration.";

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

export async function extractShoppingItemsFromImage(imageUrl: string): Promise<ShoppingItem[]> {
  try {
    console.log(`Extracting shopping items from image: ${imageUrl}`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a fashion shopping assistant that analyzes outfit images and identifies individual clothing and accessory items for shopping. Extract each distinct fashion item with detailed descriptions."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this outfit image and identify each distinct clothing and accessory item. For each item, provide:
1. A clear name (e.g., "White Linen Shirt", "Brown Leather Ankle Boots")
2. A detailed description (style, material, key features)
3. The category (e.g., "Top", "Bottom", "Shoes", "Accessories")
4. A search query optimized for Google Shopping (e.g., "buy white linen button-down shirt women")

Focus on items that are clearly visible and identifiable. Return a JSON object with an "items" array.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("No content in GPT-4 Vision response");
      return [];
    }

    const parsed = JSON.parse(content);
    const items = parsed.items || [];
    
    console.log(`Extracted ${items.length} shopping items from image`);
    return items;

  } catch (error) {
    console.error("GPT-4 Vision extraction error:", error);
    return [];
  }
}

// ── NOVA Chat Stylist: conversational AI using profile context
export async function novaChatResponse(
  message: string,
  profile: StyleProfile | null,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  try {
    let profileContext = "";
    if (profile) {
      const personality = profile.personality ? JSON.parse(profile.personality) : {};
      const lifestyle = profile.lifestyle ? JSON.parse(profile.lifestyle) : {};
      const colorPrefs = profile.colorPreferences ? JSON.parse(profile.colorPreferences) : [];
      const impressionGoals = personality.impressionGoals ? JSON.parse(personality.impressionGoals) : [];
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

    const systemPrompt = `${aurraSystemPrompt}

${profileContext ? `ACTIVE USER PROFILE:\n${profileContext}\nUse this profile to ground your answers in the user's specific identity, presence archetype, and context.` : "No profile available — give general decisive advice."}

CONVERSATIONAL MODE:
This is a chat. Respond in 2–4 short sentences max. Be direct and decisive.
Do not use JSON format. Respond in plain text.
Sound like a trusted advisor, not a chatbot.`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6), // Keep last 6 messages for context
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_completion_tokens: 300,
    });

    return response.choices[0].message.content || "I'm not sure — try rephrasing your question.";
  } catch (error) {
    console.error("NOVA chat error:", error);
    return "I'm unavailable right now. Try again in a moment.";
  }
}
