/**
 * Filters and ranks designs based on user text queries, reference designs, and metadata filters.
 * 
 * @param {Array} designs - The baseline designs metadata array.
 * @param {string} searchQuery - The text search query from the user.
 * @param {Object|null} referenceImage - The reference design selected/uploaded: { id, src, title, isCustom }.
 * @param {Object|null} filters - Active dropdown filters: { style, complexity, occasion }.
 * @returns {Array} List of designs with computed similarity/match scores, filtered and ranked.
 */
export function getRecommendations(designs, searchQuery = '', referenceImage = null, filters = null) {
  let results = designs.map(design => {
    let score = 0;

    // 1. Text Search Matching
    if (searchQuery && searchQuery.trim() !== '') {
      const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 1);
      if (queryWords.length > 0) {
        const titleLower = design.title.toLowerCase();
        const descLower = design.description.toLowerCase();
        const styleLower = design.style.toLowerCase();
        const occasionLower = design.occasion.toLowerCase();
        const complexityLower = design.complexity.toLowerCase();

        let wordMatches = 0;
        queryWords.forEach(word => {
          if (titleLower.includes(word)) {
            wordMatches += 3; // Title matches are highly weighted
          } else if (descLower.includes(word)) {
            wordMatches += 1.5;
          } else if (styleLower.includes(word) || occasionLower.includes(word) || complexityLower.includes(word)) {
            wordMatches += 2; // Tag matches
          }
        });

        if (wordMatches > 0) {
          score += Math.min(100, Math.round((wordMatches / (queryWords.length * 3)) * 100));
        }
      }
    }

    // 2. Reference Image Similarity Matching (Tag overlaps)
    if (referenceImage) {
      if (referenceImage.id === design.id) {
        score = 100;
      } else {
        const refDesign = designs.find(d => d.id === referenceImage.id);
        if (refDesign) {
          let tagMatches = 0;
          let totalWeight = 0;

          if (design.style.toLowerCase() === refDesign.style.toLowerCase()) tagMatches += 40;
          totalWeight += 40;

          if (design.occasion.toLowerCase() === refDesign.occasion.toLowerCase()) tagMatches += 30;
          totalWeight += 30;

          if (design.complexity.toLowerCase() === refDesign.complexity.toLowerCase()) tagMatches += 30;
          totalWeight += 30;

          const similarityContribution = Math.round((tagMatches / totalWeight) * 100);
          score = score > 0 ? Math.round((score + similarityContribution) / 2) : similarityContribution;
        } else if (referenceImage.isCustom) {
          // Custom uploaded image matches based on current filters or generic baseline similarity
          let customScore = 65;
          if (filters) {
            if (filters.style !== 'All' && design.style.toLowerCase() === filters.style.toLowerCase()) customScore += 15;
            if (filters.occasion !== 'All' && design.occasion.toLowerCase() === filters.occasion.toLowerCase()) customScore += 10;
            if (filters.complexity !== 'All' && design.complexity.toLowerCase() === filters.complexity.toLowerCase()) customScore += 10;
          } else {
            customScore += (parseInt(design.id) % 6) * 5;
          }
          score = Math.min(95, customScore);
        }
      }
    }

    return {
      ...design,
      similarityScore: score
    };
  });

  // 3. Apply rule-based filter constraints
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

  // 4. Rank results: Sort by score if active search or reference image exists, otherwise sort by ID
  const hasActiveQuery = (searchQuery && searchQuery.trim() !== '') || referenceImage;
  if (hasActiveQuery) {
    results.sort((a, b) => b.similarityScore - a.similarityScore);
  } else {
    results.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  }

  return results;
}
