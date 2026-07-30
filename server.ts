import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Abuse protection ──────────────────────────────────────────────────────────
// The proxy below spends the server's GEMINI_API_KEY on behalf of whoever calls it,
// so it must not accept arbitrary requests from the open internet.

// Only the models the frontend actually uses (see services/geminiService.ts).
const ALLOWED_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.5-flash-image",
]);

const RATE_WINDOW_MS = 60_000;
const GEMINI_MAX_PER_WINDOW = 30;  // a full wizard run is ~6 calls
const EMAIL_MAX_PER_WINDOW = 3;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

// Drop expired buckets so the map cannot grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now > bucket.resetAt) rateBuckets.delete(key);
  }
}, RATE_WINDOW_MS).unref();

const rateLimit = (key: string, max: number) => {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count++;
  if (bucket.count > max) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
};
// ───────────────────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Cloud Run terminates TLS upstream and forwards the caller in X-Forwarded-For.
  // Without this, req.ip is the load balancer for every request and a single
  // rate-limit bucket would be shared by all users.
  app.set("trust proxy", true);

  app.use(express.json({ limit: '50mb' }));

  // ─── Gemini Proxy ────────────────────────────────────────────────────────────
  app.post("/api/gemini", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    const limit = rateLimit(`gemini:${req.ip}`, GEMINI_MAX_PER_WINDOW);
    if (!limit.allowed) {
      res.set("Retry-After", String(limit.retryAfter));
      return res.status(429).json({ error: "Demasiadas peticiones. Intenta de nuevo en un momento." });
    }

    const { model, contents, config } = req.body;

    if (!model || !contents) {
      return res.status(400).json({ error: "Missing required fields: model, contents" });
    }

    if (!ALLOWED_MODELS.has(model)) {
      return res.status(403).json({ error: "Modelo no permitido" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ model, contents, config });
      res.json({ response: {
        text: response.text,
        candidates: response.candidates,
      } });
    } catch (error: any) {
      console.error("Gemini proxy error:", error);
      res.status(500).json({ error: error?.message || "Error calling Gemini API" });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────────

  // ─── Email Route ─────────────────────────────────────────────────────────────
  app.post("/api/request-logo", async (req, res) => {
    const { email, logoData, businessName } = req.body;

    const limit = rateLimit(`email:${req.ip}`, EMAIL_MAX_PER_WINDOW);
    if (!limit.allowed) {
      res.set("Retry-After", String(limit.retryAfter));
      return res.status(429).json({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." });
    }

    if (!email || !logoData) {
      return res.status(400).json({ error: "Email and logo data are required" });
    }

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return res.status(400).json({ error: "Correo electrónico inválido" });
    }

    if (typeof logoData !== "string" || !logoData.startsWith("data:image/")) {
      return res.status(400).json({ error: "Formato de logo inválido" });
    }

    // Falls back so a missing businessName cannot throw when building the filename.
    const safeName = typeof businessName === "string" && businessName.trim()
      ? businessName.trim().slice(0, 80)
      : "Sin nombre";

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.ethereal.email",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || "test@example.com",
          pass: process.env.SMTP_PASS || "password",
        },
      });

      const adminMailOptions = {
        from: '"EmprendeAI" <noreply@emprendeai.com>',
        to: "guillen.mateo@es.uazuay.edu.ec",
        subject: `Nueva solicitud de logo: ${safeName}`,
        text: `La persona con correo ${email} solicita el logo para el negocio "${safeName}". Se adjunta el logo generado.`,
        attachments: [
          {
            filename: `${safeName.replace(/\s+/g, '_')}_logo.png`,
            content: logoData.split("base64,")[1],
            encoding: "base64",
          },
        ],
      };

      await transporter.sendMail(adminMailOptions);
      res.json({ success: true, message: "Solicitud enviada con éxito" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Error al enviar la solicitud" });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────────

  // ─── Static / Vite ───────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("/{*splat}", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
  // ─────────────────────────────────────────────────────────────────────────────

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
