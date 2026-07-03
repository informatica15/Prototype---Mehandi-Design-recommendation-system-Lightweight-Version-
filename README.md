# Antigravity Mehandi AI — Lightweight Recommendation System

An intelligent, fully client-side **Mehndi Design Recommendation System** built with **React**, **Vite**, **Tailwind CSS**, and **TensorFlow.js**. 

This application uses a pre-trained **MobileNetV1** neural network running directly in the browser via WebGL/CPU to extract feature embedding vectors for mehndi designs. Recommendations are computed on-the-fly using cosine similarity between design vectors—requiring **no backend servers, API keys, or database dependencies**.

👉 **Live Demo:** [https://informatica15.github.io/Prototype---Mehandi-Design-recommendation-system-Lightweight-Version-/](https://informatica15.github.io/Prototype---Mehandi-Design-recommendation-system-Lightweight-Version-/)

---

## 🌟 Key Features
* **In-Browser Image Embedding Extraction**: Extracts 1024-dimensional visual features from custom uploaded hand images or selected presets using MobileNet.
* **Instant Cosine Similarity Matching**: Ranks catalog designs based on mathematical similarity of their feature vectors.
* **Precomputed Embedding Cache**: Baseline catalog embeddings are precomputed and loaded statically, maximizing initial page load speed.
* **Rule & ML Hybrid Filtering**: Seamlessly combine rule-based filters (Style, Complexity, Occasion) on top of active similarity scores.
* **Premium Glassmorphism Design**: Rich, modern visual system optimized for dark/light mode with fluid micro-animations.

---

## 🛠️ Architecture & Tech Stack
* **Frontend**: React (Functional Components + hooks), Vite (Asset pipeline & bundling).
* **Styling**: Tailwind CSS (v3) + PostCSS (Autoprefixer).
* **AI/ML Engine**: 
  * `@tensorflow/tfjs` (TensorFlow.js Core)
  * `@tensorflow/tfjs-backend-webgl` (WebGL Acceleration)
  * `@tensorflow-models/mobilenet` (Pre-trained MobileNet Image Classifier)
* **Image Decoder**: `jpeg-js` (Used during development precomputation).

---

## 📂 Project Structure
```text
/
├── .github/workflows/deploy.yml   # GitHub Actions build & deploy workflow
├── public/designs/                # Curated dataset of 30 mehndi images
├── scripts/
│   ├── download_images.js         # Scrapes Unsplash & sets up designs.json
│   └── precompute_node.js         # Runs MobileNet on CPU to compile embeddings.json
├── src/
│   ├── components/
│   │   ├── Navbar.jsx             # Glassmorphic top navigation & theme selector
│   │   ├── UploadPanel.jsx        # Reference upload zone & preset selector
│   │   ├── FilterPanel.jsx        # Category filters & Surprise Me action
│   │   ├── DesignGrid.jsx         # Image gallery with similarity badges
│   │   └── DesignModal.jsx        # Full-screen detail inspector & custom suggestions
│   ├── data/
│   │   ├── designs.json           # Baseline metadata of the catalog
│   │   └── embeddings.json        # Compiled 1024-d MobileNet vectors
│   ├── utils/
│   │   ├── model.js               # TensorFlow loading & extraction logic
│   │   ├── similarity.js          # Cosine similarity mathematics
│   │   └── recommend.js           # Recommender aggregator (Filters + ML)
│   ├── App.jsx                    # Main layout and state hub
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Tailwind imports and custom layouts
├── tailwind.config.js             # Theme & color configuration
└── vite.config.js                 # Vite asset paths for GitHub Pages
```

---

## ⚙️ Local Development Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/informatica15/Prototype---Mehandi-Design-recommendation-system-Lightweight-Version-.git
   cd Prototype---Mehandi-Design-recommendation-system-Lightweight-Version-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local dev server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/Prototype---Mehandi-Design-recommendation-system-Lightweight-Version-/` in your browser.

4. **Optional: Regenerate Dataset & Embeddings**:
   To download a fresh copy of images and re-compile baseline vector embeddings:
   ```bash
   node scripts/download_images.js
   node scripts/precompute_node.js
   ```

---

## 🎓 Model Credits & References
* **TensorFlow.js / MobileNet**: Pre-trained weights and wrapper provided by [Google's TensorFlow team](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet).
* **Dataset Images**: Publicly sourced curated collection from [Unsplash](https://unsplash.com).
* **Inspiration Reference**: This project is built as a lightweight, static client-side adaptation inspired by [AI-Mehndi-Design-Recommendation-System](https://github.com/Sabasri/AI-Mehndi-Design-Recommendation-System.git).
