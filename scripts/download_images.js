import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const designsDir = path.join(__dirname, '../public/designs');
const dataDir = path.join(__dirname, '../src/data');

// Create directories if they don't exist
if (!fs.existsSync(designsDir)) {
  fs.mkdirSync(designsDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 30 verified high-quality Unsplash image IDs representing different hand henna/mehndi or pattern styles
const imageDataset = [
  { id: "1", unsplashId: "photo-1610116306796-6fea9f4fae38", style: "Arabic", complexity: "Medium", occasion: "Festival", title: "Flowing Arabic Floral Trail", desc: "A gorgeous flowing leaf and flower trail extending diagonally across the back of the hand." },
  { id: "2", unsplashId: "photo-1562088287-bde35a1ea917", style: "Minimal", complexity: "Simple", occasion: "Everyday", title: "Minimalist Finger Bands", desc: "Clean and delicate geometric bands surrounding the fingers, perfect for a modern everyday look." },
  { id: "3", unsplashId: "photo-1617627143750-d86bc21e42bb", style: "Indian", complexity: "Detailed", occasion: "Bridal", title: "Classic Indian Bridal Palm", desc: "Heavy bridal pattern featuring peacocks, checkerboards, and intricate netting over the palm." },
  { id: "4", unsplashId: "photo-1590593162201-f67611a18b87", style: "Rajasthani", complexity: "Detailed", occasion: "Bridal", title: "Royal Rajasthani Hand Design", desc: "Traditional Rajasthani elephant motifs, palace arches, and dense paisley filler patterns." },
  { id: "5", unsplashId: "photo-1605649487212-47bdab064df7", style: "Minimal", complexity: "Simple", occasion: "Everyday", title: "Dainty Leafy Wrist Cuff", desc: "A simple vine wrapped around the wrist, resembling a delicate organic bracelet." },
  { id: "6", unsplashId: "photo-1616606103915-dea7be788566", style: "Arabic", complexity: "Simple", occasion: "Everyday", title: "Modern Arabic Wrist Vine", desc: "Bold shading and clean leafy lines that transition smoothly from the wrist to the index finger." },
  { id: "7", unsplashId: "photo-1603561591411-07134e71a2a9", style: "Indian", complexity: "Medium", occasion: "Festival", title: "Traditional Indian Circle Pattern", desc: "A beautiful circular mandala motif on the palm, surrounded by detailed finger patterns." },
  { id: "8", unsplashId: "photo-1606293926075-69a00dbfde81", style: "Rajasthani", complexity: "Medium", occasion: "Festival", title: "Rajasthani Checkerboard Palm", desc: "Striking grid panels filled with dots and small floral highlights, classic to desert styles." },
  { id: "9", unsplashId: "photo-1542382156909-9ae37b3f56fd", style: "Minimal", complexity: "Simple", occasion: "Everyday", title: "Abstract Dots & Lines", desc: "Ultra-minimalist dots along the knuckles and clean vertical accents down the hand." },
  { id: "10", unsplashId: "photo-1516035069371-29a1b244cc32", style: "Arabic", complexity: "Detailed", occasion: "Festival", title: "Rich Arabic Rose Motif", desc: "Layers of shaded roses and thick borders that create a high-contrast decorative finish." },
  { id: "11", unsplashId: "photo-1579783902614-a3fb3927b6a5", style: "Rajasthani", complexity: "Detailed", occasion: "Bridal", title: "Intricate Palace Arch Mandala", desc: "Fine-line Rajasthani artwork featuring majestic palace arches framing a micro-mandala." },
  { id: "12", unsplashId: "photo-1582201942988-13e60e4556ee", style: "Indian", complexity: "Simple", occasion: "Everyday", title: "Sweet Pea Hand Trail", desc: "A light and breezy trail of leaves and dots suitable for children or quick applications." },
  { id: "13", unsplashId: "photo-1589156280159-27698a70f29e", style: "Indian", complexity: "Detailed", occasion: "Bridal", title: "Double Hand Mirror Design", desc: "Symmetrical bridal patterns where both hands mirror each other's peacocks and mandalas." },
  { id: "14", unsplashId: "photo-1612817288484-6f916006741a", style: "Minimal", complexity: "Simple", occasion: "Everyday", title: "Petite Ring Finger Henna", desc: "A singular delicate flower on the ring finger with simple leaf tips." },
  { id: "15", unsplashId: "photo-1592194996308-7b43878e84a6", style: "Arabic", complexity: "Detailed", occasion: "Bridal", title: "Arabic Heavy Glove Design", desc: "Thick lines intertwined with fine-line shading, creating a full-coverage glove effect." },
  { id: "16", unsplashId: "photo-1596755094514-f87e34085b2c", style: "Indian", complexity: "Medium", occasion: "Festival", title: "Graceful Peacock Trail", desc: "Elegant peacock heads rising from the wrist and trailing gracefully over the index finger." },
  { id: "17", unsplashId: "photo-1598128558393-70ff21433be0", style: "Rajasthani", complexity: "Detailed", occasion: "Bridal", title: "Rajasthani Royal Elephant Motif", desc: "A highly detailed wrist cuff showcasing marching elephants and traditional grid patterns." },
  { id: "18", unsplashId: "photo-1605001011156-cbf0b0f67a51", style: "Arabic", complexity: "Medium", occasion: "Festival", title: "Criss-Cross Arabic Netting", desc: "Diagonally aligned grid elements bordered by bold leaves, displaying classic Arabic spacing." },
  { id: "19", unsplashId: "photo-1597481499750-3e6b22637e12", style: "Minimal", complexity: "Simple", occasion: "Everyday", title: "Single Wrist Band", desc: "A neat bracelet-style band featuring small triangular points and single dots." },
  { id: "20", unsplashId: "photo-1533174072545-7a4b6ad7a6c3", style: "Indian", complexity: "Medium", occasion: "Festival", title: "Elegant Lotus Mandala", desc: "A classic central mandala consisting of layered lotus petals and fine radial spacing." },
  { id: "21", unsplashId: "photo-1506084868230-bb9d95c24759", style: "Minimal", complexity: "Simple", occasion: "Everyday", title: "Minimal Crescent Moon", desc: "A dainty crescent moon and star patterns located on the back hand." },
  { id: "22", unsplashId: "photo-1590674899484-d5640e854abe", style: "Arabic", complexity: "Medium", occasion: "Everyday", title: "Chic Chevron Lines", desc: "V-shaped chevron patterns running along the index finger with leafy wrist extensions." },
  { id: "23", unsplashId: "photo-1563245372-f21724e3856d", style: "Indian", complexity: "Detailed", occasion: "Bridal", title: "Gilded Lotus Cuffs", desc: "Elaborate lotus buds inside dark negative spaces, forming a premium bridal wrist cuff." },
  { id: "24", unsplashId: "photo-1611078489935-0cb964de46d6", style: "Rajasthani", complexity: "Medium", occasion: "Festival", title: "Traditional Desert Sun Motif", desc: "Bold sunburst rays extending from a solid center, bordered by intricate swirl work." },
  { id: "25", unsplashId: "photo-1590073844006-33379778ae09", style: "Minimal", complexity: "Simple", occasion: "Everyday", title: "Single Finger Vine", desc: "A simple leafy branch winding only around the middle finger." },
  { id: "26", unsplashId: "photo-1604537529428-15bcbeecfe4d", style: "Arabic", complexity: "Medium", occasion: "Festival", title: "Flowing Paisley Trail", desc: "Connected paisley elements (kalka) flowing smoothly across the hand." },
  { id: "27", unsplashId: "photo-1595152772835-219674b2a8a6", style: "Indian", complexity: "Detailed", occasion: "Bridal", title: "Royal Shehnai Bridal Pattern", desc: "Visual motifs representing traditional instruments, combined with fine-mesh layouts." },
  { id: "28", unsplashId: "photo-1607604276583-eef5d076aa5f", style: "Rajasthani", complexity: "Detailed", occasion: "Bridal", title: "Symmetrical Royal Arch", desc: "A symmetrical mirror pattern featuring elegant dome shapes and matching finger columns." },
  { id: "29", unsplashId: "photo-1616422285623-13ff0162193c", style: "Minimal", complexity: "Simple", occasion: "Everyday", title: "Geometric Knuckles", desc: "Tiny triangles and dot groupings aligned along the finger joints." },
  { id: "30", unsplashId: "photo-1599305090598-fe179d501227", style: "Arabic", complexity: "Medium", occasion: "Festival", title: "Asymmetrical Floral Cuff", desc: "Bold floral clusters concentrated on the side of the hand, fading into fine trails." }
];

async function downloadImage(url, destPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(destPath, buffer);
    console.log(`Successfully downloaded: ${path.basename(destPath)}`);
  } catch (error) {
    console.error(`Failed to download ${url}:`, error.message);
  }
}

async function run() {
  console.log("Starting download of Mehndi image dataset...");
  const designsMetadata = [];

  for (const item of imageDataset) {
    const filename = `design_${item.id}.jpg`;
    // We request 400x400 cropped images for optimal performance and size
    const url = `https://images.unsplash.com/${item.unsplashId}?w=400&h=400&fit=crop&q=80&fm=jpg`;
    const destPath = path.join(designsDir, filename);

    await downloadImage(url, destPath);

    designsMetadata.push({
      id: item.id,
      imageUrl: `./designs/${filename}`,
      style: item.style,
      complexity: item.complexity,
      occasion: item.occasion,
      title: item.title,
      description: item.desc
    });
  }

  // Write designs.json metadata file
  const jsonPath = path.join(dataDir, 'designs.json');
  fs.writeFileSync(jsonPath, JSON.stringify(designsMetadata, null, 2), 'utf-8');
  console.log(`Successfully generated metadata: ${jsonPath}`);
}

run();
