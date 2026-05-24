import { app, initServer } from '../server/index';

// Initialize the server routes and middleware
// This is necessary because the routes are registered asynchronously
let isInitialized = false;

export default async (req: any, res: any) => {
    // Basic diagnostic for Vercel
    if (req.url === '/api/ping') {
        return res.status(200).json({ status: 'pong', initialized: isInitialized });
    }

    if (!isInitialized) {
        await initServer();
        isInitialized = true;
    }
    return app(req, res);
};

