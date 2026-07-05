// Mapping design ID to actual physical placements
export const PLACEMENT_MAPPING = {
  "1": "Back Hand",
  "2": "Fingers",
  "3": "Palm",
  "4": "Palm",
  "5": "Wrist",
  "6": "Wrist",
  "7": "Palm",
  "8": "Palm",
  "9": "Back Hand",
  "10": "Back Hand",
  "11": "Palm",
  "12": "Back Hand",
  "13": "Palm",
  "14": "Fingers",
  "15": "Palm",
  "16": "Back Hand",
  "17": "Wrist",
  "18": "Back Hand",
  "19": "Wrist",
  "20": "Palm",
  "21": "Back Hand",
  "22": "Fingers",
  "23": "Wrist",
  "24": "Palm",
  "25": "Fingers",
  "26": "Back Hand",
  "27": "Palm",
  "28": "Palm",
  "29": "Fingers",
  "30": "Wrist"
};

/**
 * Filters and ranks designs based on user text queries, reference designs, and metadata filters (including placements).
 * 
 * @param {Array} designs - The baseline designs metadata array.
 * @param {string} searchQuery - The text search query from the user.
 * @param {Object|null} referenceImage - The reference design selected: { id, src, title, isCustom }.
 * @param {Object|null} filters - Active dropdown filters: { style, complexity, occasion, placement }.
 * @returns {Array} List of designs with computed similarity/match scores, filtered and ranked.
 */
export function getRecommendations(designs, searchQuery = '', referenceImage = null, filters = null) {
  let results = designs.map(design => {
    let score = 0;
    // Map placement tag dynamically
    const placement = PLACEMENT_MAPPING[design.id] || "Palm";

    // 1. Text Search Matching
    if (searchQuery && searchQuery.trim() !== '') {
      const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 1);
      if (queryWords.length > 0) {
        const titleLower = design.title.toLowerCase();
        const descLower = design.description.toLowerCase();
        const styleLower = design.style.toLowerCase();
        const occasionLower = design.occasion.toLowerCase();
        const complexityLower = design.complexity.toLowerCase();
        const placementLower = placement.toLowerCase();

        let wordMatches = 0;
        queryWords.forEach(word => {
          if (titleLower.includes(word)) {
            wordMatches += 3; // Title matches are highly weighted
          } else if (descLower.includes(word)) {
            wordMatches += 1.5;
          } else if (styleLower.includes(word) || occasionLower.includes(word) || complexityLower.includes(word) || placementLower.includes(word)) {
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

          const refPlacement = PLACEMENT_MAPPING[refDesign.id] || "Palm";

          if (design.style.toLowerCase() === refDesign.style.toLowerCase()) tagMatches += 40;
          totalWeight += 40;

          if (design.occasion.toLowerCase() === refDesign.occasion.toLowerCase()) tagMatches += 20;
          totalWeight += 20;

          if (design.complexity.toLowerCase() === refDesign.complexity.toLowerCase()) tagMatches += 20;
          totalWeight += 20;

          if (placement.toLowerCase() === refPlacement.toLowerCase()) tagMatches += 20;
          totalWeight += 20;

          const similarityContribution = Math.round((tagMatches / totalWeight) * 100);
          score = score > 0 ? Math.round((score + similarityContribution) / 2) : similarityContribution;
        } else if (referenceImage.isCustom) {
          let customScore = 65;
          if (filters) {
            if (filters.style !== 'All' && design.style.toLowerCase() === filters.style.toLowerCase()) customScore += 10;
            if (filters.occasion !== 'All' && design.occasion.toLowerCase() === filters.occasion.toLowerCase()) customScore += 10;
            if (filters.complexity !== 'All' && design.complexity.toLowerCase() === filters.complexity.toLowerCase()) customScore += 5;
            if (filters.placement !== 'All' && placement.toLowerCase() === filters.placement.toLowerCase()) customScore += 5;
          } else {
            customScore += (parseInt(design.id) % 6) * 5;
          }
          score = Math.min(95, customScore);
        }
      }
    }

    return {
      ...design,
      placement,
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
    if (filters.placement && filters.placement !== 'All') {
      results = results.filter(d => (PLACEMENT_MAPPING[d.id] || "Palm").toLowerCase() === filters.placement.toLowerCase());
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
