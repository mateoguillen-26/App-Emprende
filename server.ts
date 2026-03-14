import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '50mb' }));

  // ─── Gemini Proxy ────────────────────────────────────────────────────────────
  app.post("/api/gemini", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    const { model, contents, config } = req.body;

    if (!model || !contents) {
      return res.status(400).json({ error: "Missing required fields: model, contents" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ model, contents, config });
      res.json({ response });
    } catch (error: any) {
      console.error("Gemini proxy error:", error);
      res.status(500).json({ error: error?.message || "Error calling Gemini API" });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────────

  // ─── Email Route ─────────────────────────────────────────────────────────────
  app.post("/api/request-logo", async (req, res) => {
    const { email, logoData, businessName } = req.body;

    if (!email || !logoData) {
      return res.status(400).json({ error: "Email and logo data are required" });
    }

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
        subject: `Nueva solicitud de logo: ${businessName}`,
        text: `La persona con correo ${email} solicita el logo para el negocio "${businessName}". Se adjunta el logo generado.`,
        attachments: [
          {
            filename: `${businessName.replace(/\s+/g, '_')}_logo.png`,
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
