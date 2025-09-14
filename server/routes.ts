import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateOutfitRecommendations, analyzeStyleProfile } from "./openai";
import { insertStyleProfileSchema, insertOutfitSchema, insertCollectionSchema } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

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
      
      const profile = await storage.getStyleProfile(userId);
      if (!profile || !profile.completed) {
        return res.status(400).json({ message: "Complete your style profile first" });
      }

      const outfits = await generateOutfitRecommendations(profile, occasion, count);
      
      // Save generated outfits
      const savedOutfits = await Promise.all(
        outfits.map(outfit => 
          storage.createOutfit({
            ...outfit,
            userId,
            occasion,
          })
        )
      );

      // Award points for generating outfits
      await storage.updateUserPoints(userId, 50);

      res.json(savedOutfits);
    } catch (error) {
      console.error("Error generating outfits:", error);
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
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
          const paymentIntent = subscription.latest_invoice.payment_intent;
          
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
          price: process.env.STRIPE_PRICE_ID || 'price_1234567890', // Will need to be set
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      const latestInvoice = subscription.latest_invoice;
      const paymentIntent = typeof latestInvoice === 'object' && latestInvoice?.payment_intent;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: typeof paymentIntent === 'object' ? paymentIntent?.client_secret : null,
      });
    } catch (error: any) {
      console.error("Stripe subscription error:", error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
