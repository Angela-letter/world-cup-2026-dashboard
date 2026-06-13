/** Runtime config: local FastAPI vs hosted static (GitHub Pages / Cloudflare Pages) */
const WC_HOSTED =
  location.hostname.endsWith("github.io") ||
  location.hostname.endsWith("pages.dev");

/** GitHub Pages 走 Cloudflare 同源 API；pages.dev 用相对路径 */
const API_BASE = location.hostname.endsWith("github.io")
  ? "https://world-cup-dashboard.pages.dev"
  : "";

const WC_DEMO = WC_HOSTED;
/** 实时 API 失败时的离线快照兜底 */
const DEMO_FALLBACK_URL = WC_DEMO ? "data/demo.json" : null;
const GITHUB_REPO = "https://github.com/Angela-letter/world-cup-2026-dashboard";
