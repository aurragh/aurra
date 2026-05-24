const modules = [
    "express",
    "./server/routes.ts",
    "./server/vite.ts",
    "./server/storage.ts",
    "./server/db.ts",
    "./server/openai.ts",
    "./server/replitAuth.ts"
];

(async () => {
    for (const mod of modules) {
        try {
            console.log(`Loading ${mod}...`);
            await import(mod);
            console.log(`Successfully loaded ${mod}`);
        } catch (error: any) {
            console.error(`FAILED to load ${mod}:`, error.message);
            if (error.stack) console.error(error.stack);
        }
    }
})();
