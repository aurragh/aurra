import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Downloads an image from a URL and saves it locally
 * @param imageUrl The URL of the image to download
 * @param outfitId The unique ID of the outfit
 * @returns The local path to the saved image or null if failed
 */
export async function downloadAndSaveImage(imageUrl: string | null, outfitId: string): Promise<string | null> {
  if (!imageUrl) return null;

  try {
    // Create the outfit-images directory if it doesn't exist
    const imagesDir = path.join(__dirname, '..', 'public', 'outfit-images');
    await fs.mkdir(imagesDir, { recursive: true });

    // Generate a unique filename for the image
    const filename = `${outfitId}.png`;
    const filepath = path.join(imagesDir, filename);

    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status} ${response.statusText}`);
      return null;
    }

    // Save the image to local filesystem
    const buffer = await response.arrayBuffer();
    await fs.writeFile(filepath, Buffer.from(buffer));

    // Return the URL path that will be served by the Express static middleware
    return `/outfit-images/${filename}`;
  } catch (error) {
    console.error('Error downloading and saving image:', error);
    return null;
  }
}

/**
 * Checks if a DALL-E URL is expired by examining the URL parameters
 * @param imageUrl The DALL-E image URL to check
 * @returns true if the URL is expired
 */
export function isImageUrlExpired(imageUrl: string | null): boolean {
  if (!imageUrl || !imageUrl.includes('oaidalleapiprodscus.blob.core.windows.net')) {
    return true;
  }

  try {
    const url = new URL(imageUrl);
    const expiryParam = url.searchParams.get('se');
    
    if (!expiryParam) return true;
    
    // Parse the expiry timestamp
    const expiryDate = new Date(expiryParam.replace('%3A', ':'));
    const now = new Date();
    
    return now > expiryDate;
  } catch (error) {
    console.error('Error checking image URL expiry:', error);
    return true;
  }
}