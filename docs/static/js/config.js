/** Runtime config: local FastAPI vs GitHub Pages static demo */
const WC_DEMO = location.hostname.endsWith("github.io");
const API = "";
const DEMO_DATA_URL = WC_DEMO ? "data/demo.json" : null;
