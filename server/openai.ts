import OpenAI from "openai";
import type { StyleProfile } from "@shared/schema";
import { aurraSystemPrompt } from "./aurraSystemPrompt";

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

    const userPrompt = `
User Profile:
- Body Type: ${profile.bodyType}
- Budget: ${profile.budget}
- Color Preferences: ${colorPrefs.join(', ')}
- Style Preferences: ${stylePrefs.join(', ')}
- Personality Traits: ${Object.entries(personality).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Lifestyle: ${Object.entries(lifestyle).map(([k, v]) => `${k}: ${v}`).join(', ')}

Occasion/Input: ${occasion}
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

// Helper function to generate outfit images - structured for easy provider swapping
async function generateWithDallE(
  basicItems: string,
  occasion: string
): Promise<string | null> {
  // Ensure we have items description
  const itemsDesc = basicItems || 'stylish outfit';
  
  try {
    // Clean minimal ghost mannequin style - SINGLE outfit, pure white background
    const imagePrompt = `Professional fashion product photography: ${itemsDesc} displayed on invisible mannequin form, ghost mannequin style for ${occasion}. PURE WHITE seamless background, no props, no equipment, no distractions. Single centered outfit composition. Ultra sharp focus, high-end e-commerce quality, clean minimal aesthetic. ONE complete look only.`;

    console.log(`DALL-E Image Prompt: ${imagePrompt}`);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural"
    });

    return response.data?.[0]?.url || null;

  } catch (error: any) {
    console.error("DALL-E API error:", error);
    
    // Fallback to even simpler prompt
    if (error?.code === 'content_policy_violation') {
      try {
        const fallbackPrompt = `Fashion product photo: ${itemsDesc} on invisible mannequin, pure white background, centered, clean minimal style`;
        
        const retryResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: fallbackPrompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          style: "natural"
        });

        return retryResponse.data?.[0]?.url || null;
      } catch (retryError) {
        console.error("DALL-E retry failed:", retryError);
        return null;
      }
    }
    
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
    
    // Include ALL outfit items including accessories (not just first 3)
    const allItems = items.map(item => 
      `${item.color} ${item.category.toLowerCase()}`
    ).join(', ');
    
    // Use DALL-E ghost mannequin style (will add Replicate option when API token is available)
    return await generateWithDallE(allItems, occasion);

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
