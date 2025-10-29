import OpenAI from "openai";
import type { StyleProfile } from "@shared/schema";

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
  name: string;
  description: string;
  items: string; // JSON string of OutfitItem[]
  aiRecommendation: string;
}

export async function generateOutfitRecommendations(
  profile: StyleProfile,
  occasion: string,
  count: number = 3
): Promise<GeneratedOutfit[]> {
  try {
    const personality = profile.personality ? JSON.parse(profile.personality) : {};
    const colorPrefs = profile.colorPreferences ? JSON.parse(profile.colorPreferences) : [];
    const stylePrefs = profile.stylePreferences ? JSON.parse(profile.stylePreferences) : [];
    const lifestyle = profile.lifestyle ? JSON.parse(profile.lifestyle) : {};

    const prompt = `As a professional fashion stylist AI, create ${count} complete outfit recommendations for a ${occasion} occasion.

User Profile:
- Body Type: ${profile.bodyType}
- Budget: ${profile.budget}
- Color Preferences: ${colorPrefs.join(', ')}
- Style Preferences: ${stylePrefs.join(', ')}
- Personality Traits: ${Object.entries(personality).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Lifestyle: ${Object.entries(lifestyle).map(([k, v]) => `${k}: ${v}`).join(', ')}

For each outfit, provide:
1. A creative name for the outfit
2. A compelling description explaining why this outfit works
3. Complete list of clothing items with specific details
4. AI reasoning for the recommendations

Respond with a JSON object containing an array of outfits. Each outfit should have:
- name: string
- description: string  
- items: array of objects with {category, description, color, style, brand_suggestions?, price_range?}
- reasoning: string explaining the AI's decision process

Focus on current fashion trends, body-flattering silhouettes, and practical styling advice.`;

    // Use the most reliable OpenAI model for outfit generation
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert fashion stylist AI with deep knowledge of current trends, body types, and personal styling. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"outfits": []}');
    const outfits = result.outfits || [];

    return outfits.map((outfit: any) => ({
      name: outfit.name || `${occasion} Look`,
      description: outfit.description || "A stylish outfit recommendation.",
      items: JSON.stringify(outfit.items || []),
      aiRecommendation: outfit.reasoning || "AI-curated styling recommendation.",
    }));

  } catch (error) {
    console.error("OpenAI API error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    // Fallback outfit recommendation
    return [{
      name: `Classic ${occasion} Look`,
      description: `A timeless and elegant outfit perfect for ${occasion}.`,
      items: JSON.stringify([
        {
          category: "Top",
          description: "Classic button-down shirt",
          color: "White",
          style: "Tailored fit"
        },
        {
          category: "Bottom", 
          description: "Well-fitted trousers",
          color: "Navy",
          style: "Straight leg"
        }
      ]),
      aiRecommendation: "This classic combination offers versatility and timeless appeal, suitable for various body types and occasions."
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
    // Ghost mannequin style with studio photography setup - SINGLE outfit ONLY
    const imagePrompt = `SINGLE outfit composition ONLY: ${itemsDesc} arranged as if worn on invisible form, ghost mannequin style, ONE complete look centered in frame for ${occasion}, white studio background with photography equipment visible (softbox umbrella, tripod, light stands), professional product shot, sharp focus, high detail - NOT multiple outfits, NOT variations, NOT side-by-side display, NOT collection layout`;

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
        const fallbackPrompt = `SINGLE outfit: ${itemsDesc} on invisible form, ghost mannequin centered, studio background, ONE composition only`;
        
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

// Future: Add Replicate/Stable Diffusion function here
// async function generateWithReplicate(...) { ... }

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
