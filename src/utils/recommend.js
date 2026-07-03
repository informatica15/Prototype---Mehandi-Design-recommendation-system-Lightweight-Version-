import { cosineSimilarity } from './similarity.js';

/**
 * Filters and ranks designs based on user selections and AI embedding similarity.
 * 
 * @param {Array} designs - The baseline designs metadata array.
 * @param {Object} embeddings - Precomputed embeddings mapping design ID to vector.
 * @param {number[] | null} queryEmbedding - The embedding of the uploaded/reference image.
 * @param {Object} filters - Rule-based filters: { style, complexity, occasion }.
 * @returns {Array} List of designs with computed similarity scores, filtered and ranked.
 */
export function getRecommendations(designs, embeddings, queryEmbedding, filters) {
  // 1. Calculate similarity for each design
  let results = designs.map(design => {
    let similarity = 0;
    
    // If an AI reference image exists, calculate the cosine similarity
    if (queryEmbedding && embeddings && embeddings[design.id]) {
      similarity = cosineSimilarity(queryEmbedding, embeddings[design.id]);
    }
    
    return {
      ...design,
      // Normalize similarity score to percentage representation (0-100%)
      similarityScore: Math.round(similarity * 100)
    };
  });

  // 2. Apply rule-based metadata filtering
  if (filters) {
    if (filters.style && filters.style !== 'All') {
      results = results.filter(d => d.style.toLowerCase() === filters.style.toLowerCase());
    }
    if (filters.complexity && filters.complexity !== 'All') {
      results = results.filter(d => d.complexity.toLowerCase() === filters.complexity.toLowerCase());
    }
    if (filters.occasion && filters.occasion !== 'All') {
      results = results.filter(d => d.occasion.toLowerCase() === filters.occasion.toLowerCase());
    }
  }

  // 3. Rank results
  if (queryEmbedding) {
    // Sort descending by similarity score
    results.sort((a, b) => b.similarityScore - a.similarityScore);
  } else {
    // Default fallback order when no reference image is selected
    results.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  }

  return results;
}
