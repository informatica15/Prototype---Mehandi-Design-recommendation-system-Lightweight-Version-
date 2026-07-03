import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let model = null;
let modelLoadingPromise = null;

/**
 * Initializes TensorFlow.js and loads the MobileNet model.
 * Caches the loading promise to prevent duplicate loading operations.
 */
export async function loadModel() {
  if (model) return model;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      // Ensure tfjs is ready and backends are configured
      await tf.ready();
      
      // Attempt to use webgl backend if available
      try {
        await tf.setBackend('webgl');
      } catch (backendError) {
        console.warn("WebGL backend failed to initialize, falling back to CPU:", backendError);
        await tf.setBackend('cpu');
      }
      
      console.log(`TensorFlow.js ready. Active backend: ${tf.getBackend()}`);
      
      // Load MobileNet v1 with alpha 1.0 (lightweight but rich features)
      model = await mobilenet.load({
        version: 1,
        alpha: 1.0
      });
      
      console.log("MobileNet model loaded successfully.");
      return model;
    } catch (err) {
      console.error("Error loading MobileNet model:", err);
      modelLoadingPromise = null;
      throw err;
    }
  })();

  return modelLoadingPromise;
}

/**
 * Extracts a 1024-dimensional feature embedding vector from an image element.
 * @param {HTMLImageElement | HTMLCanvasElement} imageElement - The image to extract features from.
 * @returns {Promise<number[]>} The computed feature vector.
 */
export async function getEmbedding(imageElement) {
  const net = await loadModel();
  
  // Wrap in tf.tidy to automatically clean up intermediate GPU/CPU tensors
  const embeddingTensor = tf.tidy(() => {
    // Passing true as the second argument extracts the activation bottleneck features (embeddings)
    return net.infer(imageElement, true);
  });
  
  // Copy the tensor data asynchronously to CPU memory
  const rawData = await embeddingTensor.data();
  
  // Dispose of the tensor to prevent memory leaks
  embeddingTensor.dispose();
  
  // Convert Float32Array to a standard JavaScript array
  return Array.from(rawData);
}
