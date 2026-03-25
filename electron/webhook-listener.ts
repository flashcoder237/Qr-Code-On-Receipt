import { createHmac, timingSafeEqual } from "node:crypto";
import http from "node:http";
import type { BrowserWindow } from "electron";

function verifySignature(body: string, secret: string, sigHeader: string): boolean {
  if (!secret || !sigHeader) return !secret; // if no secret configured, skip verification
  try {
    const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
    const sigBuf = Buffer.from(sigHeader);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

export function startWebhookListener(
  port: number,
  secret: string,
  win: BrowserWindow,
): http.Server {
  const server = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/webhook") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      const sig = (req.headers["x-diplomation-signature"] as string) ?? "";

      if (!verifySignature(body, secret, sig)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid signature" }));
        return;
      }

      let payload: { event: string } & Record<string, unknown>;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
        return;
      }

      console.log(`[Webhook] Received event: ${payload.event}`);

      switch (payload.event) {
        case "deliberation.signed":
          win.webContents.send("grades-manager:deliberation-signed", payload);
          break;
        case "semester.grades_locked":
          win.webContents.send("grades-manager:semester-locked", payload);
          break;
        default:
          console.warn(`[Webhook] Unknown event: ${payload.event}`);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });

    req.on("error", (err) => {
      console.error("[Webhook] Request error:", err);
      res.writeHead(500);
      res.end();
    });
  });

  server.on("error", (err) => {
    console.error(`[Webhook] Server error on port ${port}:`, err);
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[Webhook] Listening on port ${port}`);
  });

  return server;
}
