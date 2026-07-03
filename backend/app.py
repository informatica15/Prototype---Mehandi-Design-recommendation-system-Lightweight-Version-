import os
import json
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI application
app = FastAPI(
    title="Mehndi Design Recommendation API",
    description="Python backend service mock for matching and filtering mehndi designs.",
    version="1.0.0"
)

# Enable CORS for frontend client connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load database catalog path
DESIGNS_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "designs.json")

def load_designs():
    """Helper utility to read the JSON design catalog data."""
    try:
        if os.path.exists(DESIGNS_FILE):
            with open(DESIGNS_FILE, "r") as file:
                return json.load(file)
        # Fallback empty list if file not located
        return []
    except Exception as e:
        print(f"Error loading catalog: {e}")
        return []

# Pydantic Schemas for Requests & Responses
class FilterParams(BaseModel):
    style: Optional[str] = "All"
    occasion: Optional[str] = "All"
    complexity: Optional[str] = "All"

class RecommendationRequest(BaseModel):
    searchQuery: Optional[str] = ""
    referenceId: Optional[str] = None
    filters: Optional[FilterParams] = None

class DesignResponse(BaseModel):
    id: str
    imageUrl: str
    style: str
    complexity: str
    occasion: str
    title: str
    description: str
    similarityScore: int

@app.get("/api/designs", response_model=List[dict])
def get_all_designs():
    """Endpoint: Fetches the entire unmodified Mehndi design catalog."""
    catalog = load_designs()
    if not catalog:
        raise HTTPException(status_code=500, detail="Catalog database could not be loaded.")
    return catalog

@app.post("/api/recommend", response_model=List[DesignResponse])
def recommend_designs(req: RecommendationRequest):
    """
    Endpoint: Processes recommendation requests.
    Performs keyword text scoring and metadata tag similarity calculations
    to rank catalog designs in descending match percentages.
    """
    catalog = load_designs()
    if not catalog:
        raise HTTPException(status_code=500, detail="Catalog database could not be loaded.")

    results = []
    
    # Extract request values
    query_text = req.searchQuery.strip().lower() if req.searchQuery else ""
    ref_id = req.referenceId
    filters = req.filters

    # Locate reference design if provided
    ref_design = None
    if ref_id:
        for item in catalog:
            if item.get("id") == ref_id:
                ref_design = item
                break

    for design in catalog:
        score = 0
        
        # 1. Text Search Matching Logic
        if query_text:
            query_words = [w for w in query_text.split() if len(w) > 1]
            if query_words:
                title_lower = design.get("title", "").lower()
                desc_lower = design.get("description", "").lower()
                style_lower = design.get("style", "").lower()
                occasion_lower = design.get("occasion", "").lower()
                complexity_lower = design.get("complexity", "").lower()

                matches = 0
                for word in query_words:
                    if word in title_lower:
                        matches += 3  # High weight for titles
                    elif word in desc_lower:
                        matches += 1.5
                    elif word in style_lower or word in occasion_lower or word in complexity_lower:
                        matches += 2  # Category matches

                if matches > 0:
                    score += min(100, int((matches / (len(query_words) * 3)) * 100))

        # 2. Tag Similarity Matching Logic (Reference design similarity)
        if ref_design:
            if ref_id == design.get("id"):
                score = 100
            else:
                tag_matches = 0
                total_weight = 0

                # Compare Style (40% weight)
                if design.get("style", "").lower() == ref_design.get("style", "").lower():
                    tag_matches += 40
                total_weight += 40

                # Compare Occasion (30% weight)
                if design.get("occasion", "").lower() == ref_design.get("occasion", "").lower():
                    tag_matches += 30
                total_weight += 30

                # Compare Complexity (30% weight)
                if design.get("complexity", "").lower() == ref_design.get("complexity", "").lower():
                    tag_matches += 30
                total_weight += 30

                similarity_contribution = int((tag_matches / total_weight) * 100)
                # Blend text search score and tag matching if both exist
                score = int((score + similarity_contribution) / 2) if score > 0 else similarity_contribution

        # Add score attribute
        design_match = dict(design)
        design_match["similarityScore"] = score
        results.append(design_match)

    # 3. Apply Category Filters
    if filters:
        if filters.style and filters.style.lower() != "all":
            results = [d for d in results if d.get("style", "").lower() == filters.style.lower()]
        if filters.occasion and filters.occasion.lower() != "all":
            results = [d for d in results if d.get("occasion", "").lower() == filters.occasion.lower()]
        if filters.complexity and filters.complexity.lower() != "all":
            results = [d for d in results if d.get("complexity", "").lower() == filters.complexity.lower()]

    # 4. Rank/Sort Recommendations
    has_active_query = bool(query_text) or bool(ref_id)
    if has_active_query:
        # Sort descending by match score
        results.sort(key=lambda x: x["similarityScore"], reverse=True)
    else:
        # Default order by ID
        results.sort(key=lambda x: int(x.get("id", 0)))

    return results

if __name__ == "__main__":
    import uvicorn
    # Serves the FastAPI server on localhost:8000 when executed directly
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
