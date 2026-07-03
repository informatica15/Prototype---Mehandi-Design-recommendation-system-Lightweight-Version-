import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import jpeg from 'jpeg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const designsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/designs.json'), 'utf8'));
const designsDir = path.join(__dirname, '../public/designs');
const embeddingsPath = path.join(__dirname, '../src/data/embeddings.json');

async function run() {
  console.log("Loading MobileNet v1 model on Node.js CPU backend...");
  // Explicitly trigger tfjs ready state
  await tf.ready();
  
  const net = await mobilenet.load({
    version: 1,
    alpha: 1.0
  });
  console.log("Model loaded successfully.");

  const embeddings = {};

  for (const design of designsData) {
    const filename = path.basename(design.imageUrl);
    const imgPath = path.join(designsDir, filename);
    
    console.log(`Processing image ${design.id}: ${filename}...`);
    
    // Read and decode JPEG
    const fileBuf = fs.readFileSync(imgPath);
    const rawImageData = jpeg.decode(fileBuf, { useTimpCanvas: false });
    
    // Convert decoded image pixels to RGB Tensor
    const numChannels = 3;
    const numPixels = rawImageData.width * rawImageData.height;
    const values = new Int32Array(numPixels * numChannels);

    for (let i = 0; i < numPixels; i++) {
      values[i * numChannels + 0] = rawImageData.data[i * 4 + 0]; // R
      values[i * numChannels + 1] = rawImageData.data[i * 4 + 1]; // G
      values[i * numChannels + 2] = rawImageData.data[i * 4 + 2]; // B
    }

    const outShape = [rawImageData.height, rawImageData.width, numChannels];
    const inputTensor = tf.tensor3d(values, outShape, 'int32');
    
    // Extract activation embedding
    const embeddingTensor = tf.tidy(() => {
      return net.infer(inputTensor, true);
    });

    const embeddingArray = Array.from(await embeddingTensor.data());
    embeddings[design.id] = embeddingArray;

    // Clean up tensors
    inputTensor.dispose();
    embeddingTensor.dispose();
  }

  // Save to embeddings.json
  fs.writeFileSync(embeddingsPath, JSON.stringify(embeddings, null, 2), 'utf-8');
  console.log(`Successfully precomputed embeddings and saved to ${embeddingsPath}`);
}

run().catch(err => {
  console.error("Precomputation failed:", err);
  process.exit(1);
});
