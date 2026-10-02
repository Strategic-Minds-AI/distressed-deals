import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

/**
 * Uploads a file to Google Drive and returns a shareable link.
 * Frontend sends: { filename, mimeType, base64data, folderId? }
 * Returns: { fileId, publicUrl, webViewLink }
 */
export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { filename, mimeType, base64data, folderId } = body;

    if (!filename || !mimeType || !base64data) {
      return Response.json({ error: "Missing filename, mimeType, or base64data" }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");

    // Decode base64 to bytes
    const binaryString = atob(base64data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Build multipart/related body
    const boundary = "boundary" + Math.random().toString(16).substring(2);
    const metadata = JSON.stringify({
      name: filename,
      ...(folderId ? { parents: [folderId] } : {}),
    });

    const encoder = new TextEncoder();
    const head = encoder.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const tail = encoder.encode(`\r\n--${boundary}--`);

    const merged = new Uint8Array(head.length + bytes.length + tail.length);
    merged.set(head, 0);
    merged.set(bytes, head.length);
    merged.set(tail, head.length + bytes.length);

    // Upload to Drive
    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: merged,
      }
    );

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      return Response.json({ error: `Drive upload failed: ${uploadRes.status} ${text}` }, { status: 500 });
    }

    const fileData = await uploadRes.json();

    // Make the file publicly readable
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileData.id}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    });

    return Response.json({
      fileId: fileData.id,
      webViewLink: fileData.webViewLink,
      publicUrl: `https://drive.google.com/uc?export=view&id=${fileData.id}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}