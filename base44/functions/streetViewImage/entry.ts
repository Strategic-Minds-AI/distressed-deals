import { secrets } from "base44:runtime";

/**
 * Public proxy for Google Street View Static API.
 * Returns an actual street-level photo of the property at the given coordinates.
 *
 * Query params:
 *   lat, lng  — required, property coordinates
 *   heading   — optional, compass heading 0-360 (default 0 = north)
 *   size      — optional, image dimensions (default 640x400, max 640x640)
 *   pitch     — optional, vertical angle -90 to 90 (default -10)
 *
 * The Google API key is kept server-side and never exposed to the client.
 */
export default async function (req: Request) {
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  if (!lat || !lng) {
    return new Response("Missing lat or lng", { status: 400 });
  }

  const apiKey = secrets.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    return new Response("Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY in Secrets.", { status: 500 });
  }

  const heading = url.searchParams.get("heading") || "0";
  const size = url.searchParams.get("size") || "640x400";
  const pitch = url.searchParams.get("pitch") || "-10";

  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&key=${apiKey}`;

  try {
    const response = await fetch(streetViewUrl);
    if (!response.ok) {
      return new Response("Street View fetch failed", { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (error) {
    return new Response(`Street View error: ${error.message}`, { status: 502 });
  }
}