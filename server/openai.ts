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

export async function generateOutfitImage(
  outfit: GeneratedOutfit,
  profile: StyleProfile,
  occasion: string
): Promise<string | null> {
  try {
    const items = JSON.parse(outfit.items || '[]') as OutfitItem[];
    
    // Create a safe, simple description for the outfit image
    const basicItems = items.slice(0, 3).map(item => 
      `${item.color} ${item.category.toLowerCase()}`
    ).join(', ');
    
    // Ultra-simple prompt focusing on single professional model portrait
    const imagePrompt = `Professional model portrait. One person standing, full body visible, ${basicItems}, ${occasion} setting. Natural outdoor location. Single photograph, one individual, no duplicates, seamless background.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1792",
      quality: "standard",  // Testing if 'standard' quality reduces split-screen bias
      style: "natural"
    });

    return response.data?.[0]?.url || null;

  } catch (error: any) {
    console.error("DALL-E API error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // If it's a safety system error, try with an even more basic prompt
    if (error?.code === 'content_policy_violation') {
      try {
        console.log("Retrying with basic prompt due to safety violation...");
        const fallbackPrompt = `Full-body portrait of one person for ${occasion}, standing outdoors. Single subject, centered, natural lighting. No split screen, no duplicate, no comparison.`;
        
        const retryResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: fallbackPrompt,
          n: 1,
          size: "1024x1792",  // Vertical ratio
          quality: "hd",
          style: "natural"
        });

        return retryResponse.data?.[0]?.url || null;
      } catch (retryError) {
        console.error("Retry also failed:", retryError);
        return null;
      }
    }
    
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
