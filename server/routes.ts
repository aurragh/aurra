import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateOutfitRecommendations, analyzeStyleProfile, generateOutfitImage } from "./openai";
import { insertStyleProfileSchema, insertOutfitSchema, insertCollectionSchema } from "@shared/schema";

// Stripe configuration - will work without payment features if not configured
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
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
      const { occasion, count = 3 } = req.body;
      
      console.log(`Generating outfits for user ${userId}, occasion: ${occasion}, count: ${count}`);
      
      const profile = await storage.getStyleProfile(userId);
      console.log('Retrieved style profile:', profile ? 'found' : 'not found', profile ? `completed: ${profile.completed}` : '');
      
      if (!profile || !profile.completed) {
        console.log('Style profile incomplete, returning 400');
        return res.status(400).json({ message: "Complete your style profile first" });
      }

      console.log('Calling generateOutfitRecommendations...');
      const outfits = await generateOutfitRecommendations(profile, occasion, count);
      console.log(`Generated ${outfits.length} outfits from OpenAI:`, outfits.map(o => o.name));
      
      // Generate images for each outfit
      console.log('Generating images for outfits...');
      const outfitsWithImages = await Promise.all(
        outfits.map(async (outfit, index) => {
          console.log(`Generating image for outfit ${index + 1}: ${outfit.name}`);
          try {
            const imageUrl = await generateOutfitImage(outfit, profile, occasion);
            console.log(`Image generated for outfit ${index + 1}:`, imageUrl ? 'success' : 'failed');
            return {
              ...outfit,
              imageUrl,
              userId,
              occasion,
            };
          } catch (error) {
            console.error(`Failed to generate image for outfit ${index + 1}:`, error);
            return {
              ...outfit,
              imageUrl: null, // Continue without image if generation fails
              userId,
              occasion,
            };
          }
        })
      );
      
      // Save generated outfits with images
      console.log('Saving outfits to database...');
      const savedOutfits = await Promise.all(
        outfitsWithImages.map(async (outfit, index) => {
          try {
            console.log(`Saving outfit ${index + 1}: ${outfit.name}`);
            const saved = await storage.createOutfit(outfit);
            console.log(`Saved outfit ${index + 1} with ID: ${saved.id}`);
            return saved;
          } catch (error) {
            console.error(`Failed to save outfit ${index + 1}:`, error);
            throw error;
          }
        })
      );

      // Award points for generating outfits
      console.log('Awarding points to user...');
      await storage.updateUserPoints(userId, 50);
      console.log(`Successfully generated and saved ${savedOutfits.length} outfits`);

      res.json(savedOutfits);
      console.log('Response sent successfully');
    } catch (error) {
      console.error("Error generating outfits:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      res.status(500).json({ message: "Failed to generate outfits" });
    }
  });

  // Outfit management routes
  app.get('/api/outfits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outfits = await storage.getUserOutfits(userId);
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

  // Admin routes - protected by admin check
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user || req.user.claims.email !== "writersure369@gmail.com") {
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

  const httpServer = createServer(app);
  return httpServer;
}
