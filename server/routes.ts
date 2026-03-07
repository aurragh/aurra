import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateOutfitRecommendations, analyzeStyleProfile, generateOutfitImage, extractShoppingItemsFromImage, novaChatResponse } from "./openai";
import { downloadAndSaveImage, isImageUrlExpired } from "./imageUtils";
import { insertStyleProfileSchema, insertOutfitSchema, insertCollectionSchema, insertShoppingAnalyticsSchema, insertWardrobeItemSchema } from "@shared/schema";
import path from 'path';
import { fileURLToPath } from 'url';
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stripe configuration - will work without payment features if not configured
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from public directory (for outfit images)
  app.use('/outfit-images', (await import('express')).default.static(path.join(__dirname, '..', 'public', 'outfit-images')));

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      try {
        // Try to fetch from database first
        const user = await storage.getUser(userId);
        res.json(user);
      } catch (dbError) {
        // If database fails, return user data from session
        console.warn("Database unavailable, returning session user data");
        const sessionUser = {
          id: req.user.claims.sub,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: req.user.claims.profile_image_url,
          points: 0,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: null,
        };
        res.json(sessionUser);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Style profile routes
  app.get('/api/style-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getStyleProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching style profile:", error);
      res.status(500).json({ message: "Failed to fetch style profile" });
    }
  });

  app.post('/api/style-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertStyleProfileSchema.parse({
        ...req.body,
        userId,
      });

      const profile = await storage.createOrUpdateStyleProfile(profileData);
      
      // Award points for completing profile
      if (profileData.completed) {
        await storage.updateUserPoints(userId, 200);
      }

      res.json(profile);
    } catch (error) {
      console.error("Error saving style profile:", error);
      res.status(500).json({ message: "Failed to save style profile" });
    }
  });

  // AI outfit generation routes
  app.post('/api/generate-outfits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { occasion } = req.body;
      
      console.log(`Generating Aurra recommendation for user ${userId}, occasion: ${occasion}`);
      
      const profile = await storage.getStyleProfile(userId);
      
      if (!profile || !profile.completed) {
        return res.status(400).json({ message: "Complete your style profile first" });
      }

      // Check for free outfit credits first
      const usedCredit = await storage.useFreeOutfitCredit(userId);
      if (usedCredit) {
        console.log(`User ${userId} is using a free outfit credit`);
      }

      // Aurra always gives ONE primary direction as per spec
      const recommendations = await generateOutfitRecommendations(profile, occasion, 1);
      const recommendation = recommendations[0];
      
      // Save the recommendation as an "outfit" for persistence
      const savedOutfit = await storage.createOutfit({
        name: "Aurra Recommendation",
        description: recommendation.primary || "",
        items: recommendation.items,
        aiRecommendation: recommendation.aiRecommendation,
        primaryRecommendation: recommendation.primary,
        backupRecommendation: recommendation.backup,
        avoidRecommendation: recommendation.avoid,
        whyRecommendation: recommendation.why,
        userId,
        occasion,
        imageUrl: null
      });

      // Generate image based on primary direction
      try {
        const temporaryImageUrl = await generateOutfitImage(recommendation, profile, occasion);
        if (temporaryImageUrl) {
          const localImageUrl = await downloadAndSaveImage(temporaryImageUrl, savedOutfit.id);
          if (localImageUrl) {
            await storage.updateOutfitImage(savedOutfit.id, localImageUrl, temporaryImageUrl);
          }
        }
      } catch (imageError) {
        console.error("Image generation failed:", imageError);
      }

      const finalOutfit = await storage.getOutfit(savedOutfit.id, userId);
      res.json([finalOutfit]); // Return as array for frontend compatibility

      // Award points only if not using a free credit (avoid double benefit)
      if (!usedCredit) {
        await storage.updateUserPoints(userId, 50);
      }
    } catch (error) {
      console.error("Aurra generation error:", error);
      res.status(500).json({ message: "Failed to generate recommendation" });
    }
  });

  // Outfit management routes
  app.get('/api/outfits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outfits = await storage.getUserOutfits(userId);
      
      // Asynchronously regenerate expired images in the background
      // This won't block the response
      outfits.forEach((outfit) => {
        // Check if this is an expired DALL-E URL that needs regeneration
        if (outfit.imageUrl && !outfit.imageUrl.startsWith('/outfit-images/') && isImageUrlExpired(outfit.imageUrl)) {
          // Fire and forget - regenerate in background
          (async () => {
            console.log(`Background: Regenerating expired image for outfit: ${outfit.name}`);
            try {
              const profile = await storage.getStyleProfile(userId);
              if (profile && profile.completed) {
                const outfitData = {
                  items: outfit.items || '[]',
                  name: outfit.name || 'Outfit',
                  description: outfit.description || '',
                  aiRecommendation: outfit.aiRecommendation || '',
                  primary: outfit.primaryRecommendation || '',
                  backup: outfit.backupRecommendation || '',
                  avoid: outfit.avoidRecommendation || '',
                  why: outfit.whyRecommendation || ''
                };
                const temporaryImageUrl = await generateOutfitImage(
                  outfitData,
                  profile,
                  outfit.occasion || 'casual'
                );
                
                if (temporaryImageUrl) {
                  const localImageUrl = await downloadAndSaveImage(temporaryImageUrl, outfit.id);
                  if (localImageUrl) {
                    await storage.updateOutfitImage(outfit.id, localImageUrl);
                    console.log(`Background: Successfully regenerated image for outfit ${outfit.id}`);
                  }
                }
              }
            } catch (error) {
              console.error(`Background: Failed to regenerate image for outfit ${outfit.id}:`, error);
            }
          })();
        }
      });
      
      // Return outfits immediately, even if some images are expired
      // The client can show placeholders while images are being regenerated
      res.json(outfits);
    } catch (error) {
      console.error("Error fetching outfits:", error);
      res.status(500).json({ message: "Failed to fetch outfits" });
    }
  });

  app.post('/api/outfits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outfitData = insertOutfitSchema.parse({
        ...req.body,
        userId,
      });

      const outfit = await storage.createOutfit(outfitData);
      res.json(outfit);
    } catch (error) {
      console.error("Error creating outfit:", error);
      res.status(500).json({ message: "Failed to create outfit" });
    }
  });

  app.patch('/api/outfits/:id/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const outfit = await storage.toggleFavoriteOutfit(id);
      res.json(outfit);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  app.delete('/api/outfits/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteOutfit(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting outfit:", error);
      res.status(500).json({ message: "Failed to delete outfit" });
    }
  });

  // Trash/deleted outfits routes
  app.get('/api/outfits/trash', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deletedOutfits = await storage.getUserDeletedOutfits(userId);
      res.json(deletedOutfits);
    } catch (error) {
      console.error("Error fetching deleted outfits:", error);
      res.status(500).json({ message: "Failed to fetch deleted outfits" });
    }
  });

  app.post('/api/outfits/:id/restore', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const outfit = await storage.restoreOutfit(id);
      res.json(outfit);
    } catch (error) {
      console.error("Error restoring outfit:", error);
      res.status(500).json({ message: "Failed to restore outfit" });
    }
  });

  app.delete('/api/outfits/:id/permanent', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.permanentlyDeleteOutfit(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error permanently deleting outfit:", error);
      res.status(500).json({ message: "Failed to permanently delete outfit" });
    }
  });

  // Collection management routes
  app.get('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collections = await storage.getUserCollections(userId);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  app.post('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collectionData = insertCollectionSchema.parse({
        ...req.body,
        userId,
      });

      const collection = await storage.createCollection(collectionData);
      
      // Award points for creating collection
      await storage.updateUserPoints(userId, 100);
      
      res.json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  // Points and user dashboard
  app.get('/api/user/points', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let points = await storage.getUserPoints(userId);
      
      if (!points) {
        points = await storage.initializeUserPoints(userId);
      }
      
      res.json(points);
    } catch (error) {
      console.error("Error fetching user points:", error);
      res.status(500).json({ message: "Failed to fetch user points" });
    }
  });

  // Stripe subscription management
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing not configured. Please contact support." });
    }
    
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
          const invoice = subscription.latest_invoice as any;
          const paymentIntent = invoice.payment_intent;
          
          res.json({
            subscriptionId: subscription.id,
            clientSecret: typeof paymentIntent === 'object' ? paymentIntent?.client_secret : null,
          });
          return;
        }
      }
      
      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID || process.env.STRIPE_PREMIUM_PRICE_ID || 'price_1234567890', // Configure in environment
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      const latestInvoice = subscription.latest_invoice;
      const paymentIntent = typeof latestInvoice === 'object' && (latestInvoice as any)?.payment_intent;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: typeof paymentIntent === 'object' ? paymentIntent?.client_secret : null,
      });
    } catch (error: any) {
      console.error("Stripe subscription error:", error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  // Shopping assistant routes
  app.post('/api/outfits/:id/shopping', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outfitId = req.params.id;
      
      // Get the outfit to access its image URL
      const outfit = await storage.getOutfit(outfitId, userId);
      if (!outfit) {
        return res.status(404).json({ message: "Outfit not found" });
      }
      
      if (!outfit.imageUrl) {
        return res.status(400).json({ message: "Outfit has no image to analyze" });
      }
      
      // Construct public URL for GPT-4 Vision
      let publicImageUrl: string;
      
      if (outfit.imageUrl.startsWith('http://') || outfit.imageUrl.startsWith('https://')) {
        // Already an absolute URL (legacy DALL-E URLs)
        publicImageUrl = outfit.imageUrl;
      } else {
        // Relative path - construct full URL using request host
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const host = req.get('host') || 'localhost:5000';
        publicImageUrl = `${protocol}://${host}${outfit.imageUrl}`;
      }
      
      console.log(`Shopping assistant analyzing image: ${publicImageUrl}`);
      
      // Extract shopping items using GPT-4 Vision with public URL
      const itemsRaw = await extractShoppingItemsFromImage(publicImageUrl);
      
      // Defensive guard: ensure items is always an array
      const items = Array.isArray(itemsRaw) ? itemsRaw : [];
      
      // Generate Google Shopping URLs for each item with proper null checking
      const shoppingItems = items
        .filter(item => item && item.name) // Filter out invalid items
        .map(item => ({
          name: item.name || "Fashion Item",
          description: item.description || "Stylish fashion piece",
          category: item.category || "Clothing",
          shoppingLinks: [
            {
              store: "Google Shopping",
              url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.searchQuery || item.name || "fashion item")}`
            }
          ]
        }));
      
      res.json({ items: shoppingItems });
    } catch (error) {
      console.error("Error extracting shopping items:", error);
      res.status(500).json({ message: "Failed to extract shopping items" });
    }
  });

  app.post('/api/analytics/shopping-click', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analyticsData = insertShoppingAnalyticsSchema.parse({
        ...req.body,
        userId,
      });
      
      await storage.trackShoppingClick(analyticsData);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error tracking shopping click:", error);
      
      // Return 400 for validation errors, 500 for other errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to track shopping click" });
    }
  });

  // Admin routes - protected by admin check
  const ADMIN_EMAILS = [
    "writersure369@gmail.com",
    "novacreates888@gmail.com"
  ];
  
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user || !ADMIN_EMAILS.includes(req.user.claims.email)) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/outfits', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const outfits = await storage.getAllOutfits();
      res.json(outfits);
    } catch (error) {
      console.error("Error fetching all outfits:", error);
      res.status(500).json({ message: "Failed to fetch outfits" });
    }
  });

  // PayPal payment routes
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req: any, res) => {
    try {
      // First capture the PayPal order
      const captureResult = await new Promise<any>((resolve, reject) => {
        const mockRes = {
          status: (code: number) => ({
            json: (data: any) => {
              if (code >= 400) reject(data);
              else resolve({ statusCode: code, data });
            }
          }),
          json: (data: any) => resolve({ statusCode: 200, data })
        };
        capturePaypalOrder(req, mockRes as any);
      });

      // If capture was successful and user is authenticated, upgrade their subscription
      if (captureResult.data?.status === "COMPLETED" && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        const amount = captureResult.data?.purchase_units?.[0]?.amount?.value;
        const plan = parseFloat(amount || "0") > 15 ? "pro" : "premium";
        
        await storage.updateUserSubscription(userId, plan);
        console.log(`User ${userId} upgraded to ${plan} after successful PayPal payment`);
      }

      res.status(captureResult.statusCode).json(captureResult.data);
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.status(500).json({ error: "Failed to capture order" });
    }
  });

  // Upgrade subscription endpoint
  app.post('/api/upgrade', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { plan, discountCode } = req.body;
      
      // If discount code provided, validate it belongs to user and consume it
      if (discountCode) {
        // First verify the code belongs to this user
        const userActiveDiscount = await storage.getActiveDiscountCode(userId);
        if (!userActiveDiscount || userActiveDiscount.code !== discountCode) {
          return res.status(400).json({ 
            message: "Invalid discount code. This code doesn't belong to your account or has already been used." 
          });
        }
        
        // Consume the discount code
        const discountResult = await storage.useDiscountCode(discountCode);
        if (!discountResult.success) {
          return res.status(400).json({ 
            message: "Failed to apply discount code. It may have already been used." 
          });
        }
        console.log(`Discount code ${discountCode} applied for user ${userId}: $${(discountResult.discountAmount / 100).toFixed(2)} off`);
      }
      
      // Update user subscription status
      await storage.updateUserSubscription(userId, plan || 'premium');
      
      res.json({ success: true, message: 'Subscription upgraded successfully' });
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ message: "Failed to upgrade subscription" });
    }
  });

  // Points redemption routes
  app.get('/api/points', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let points = await storage.getUserPoints(userId);
      
      // Initialize points if not exists
      if (!points) {
        points = await storage.initializeUserPoints(userId);
      }
      
      const transactions = await storage.getPointTransactions(userId);
      const activeTrial = await storage.getActivePremiumTrial(userId);
      const activeDiscount = await storage.getActiveDiscountCode(userId);
      const freeOutfitCredits = await storage.getFreeOutfitCredits(userId);
      
      res.json({
        points: points.points ?? 0,
        level: points.level ?? 'Beginner',
        totalEarned: points.totalEarned ?? 0,
        transactions,
        activeTrial: activeTrial ? { expiresAt: activeTrial.expiresAt } : null,
        activeDiscount: activeDiscount ? { code: activeDiscount.code, discountAmount: activeDiscount.discountAmount } : null,
        freeOutfitCredits,
      });
    } catch (error) {
      console.error("Error fetching points:", error);
      res.status(500).json({ message: "Failed to fetch points" });
    }
  });

  app.post('/api/points/redeem/outfit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.redeemPointsForOutfit(userId);
      res.json(result);
    } catch (error) {
      console.error("Error redeeming points for outfit:", error);
      res.status(500).json({ message: "Failed to redeem points" });
    }
  });

  app.post('/api/points/redeem/premium-trial', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.redeemPointsForPremiumTrial(userId);
      res.json(result);
    } catch (error) {
      console.error("Error redeeming points for premium trial:", error);
      res.status(500).json({ message: "Failed to redeem points" });
    }
  });

  app.post('/api/points/redeem/discount', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.redeemPointsForDiscount(userId);
      res.json(result);
    } catch (error) {
      console.error("Error redeeming points for discount:", error);
      res.status(500).json({ message: "Failed to redeem points" });
    }
  });

  app.post('/api/discount/apply', isAuthenticated, async (req: any, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "Discount code required" });
      }
      const result = await storage.useDiscountCode(code);
      if (result.success) {
        res.json({ success: true, discountAmount: result.discountAmount / 100 }); // Convert cents to dollars
      } else {
        res.json({ success: false, message: "Invalid or expired discount code" });
      }
    } catch (error) {
      console.error("Error applying discount:", error);
      res.status(500).json({ message: "Failed to apply discount" });
    }
  });

  // ── NOVA Chat Stylist
  app.post('/api/nova/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message required" });
      }
      const userId = req.user.claims.sub;
      const profile = await storage.getStyleProfile(userId);
      const reply = await novaChatResponse(message, profile || null, history || []);
      res.json({ reply });
    } catch (error) {
      console.error("NOVA chat error:", error);
      res.status(500).json({ message: "NOVA is unavailable right now." });
    }
  });

  // ── Digital Wardrobe
  app.get('/api/wardrobe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getWardrobeItems(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching wardrobe:", error);
      res.status(500).json({ message: "Failed to fetch wardrobe" });
    }
  });

  app.post('/api/wardrobe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parsed = insertWardrobeItemSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid item data", errors: parsed.error.errors });
      }
      const item = await storage.createWardrobeItem(parsed.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating wardrobe item:", error);
      res.status(500).json({ message: "Failed to add item" });
    }
  });

  app.delete('/api/wardrobe/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteWardrobeItem(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting wardrobe item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
