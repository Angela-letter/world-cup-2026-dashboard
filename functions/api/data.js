import { fetchAllData } from "../lib/worldcup-data.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet() {
  try {
    const data = await fetchAllData();
    return Response.json(data, { headers: CORS });
  } catch (err) {
    return Response.json(
      { error: "Failed to fetch live data", detail: String(err?.message || err) },
      { status: 502, headers: CORS }
    );
  }
}
