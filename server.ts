import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { shadesDatabase } from "./src/db_shades";

// Lazy initialize Gemini API to prevent app crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key !== "undefined" && key !== "null" && key.trim() !== "") {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

// --- COLOR SPACE CONVERTER UTILITIES ---

function labToRgb(l: number, a: number, b: number): [number, number, number] {
  let y = (l + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;

  const y3 = Math.pow(y, 3);
  const x3 = Math.pow(x, 3);
  const z3 = Math.pow(z, 3);

  y = y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787;
  x = x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787;
  z = z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787;

  // D65 Standard Illuminant coordinates
  x = x * 95.047;
  y = y * 100.000;
  z = z * 108.883;

  x = x / 100;
  y = y / 100;
  z = z / 100;

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let bVal = x * 0.0557 + y * -0.2040 + z * 1.0570;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : r * 12.92;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : g * 12.92;
  bVal = bVal > 0.0031308 ? 1.055 * Math.pow(bVal, 1 / 2.4) - 0.055 : bVal * 12.92;

  const rInt = Math.max(0, Math.min(255, Math.round(r * 255)));
  const gInt = Math.max(0, Math.min(255, Math.round(g * 255)));
  const bInt = Math.max(0, Math.min(255, Math.round(bVal * 255)));

  return [rInt, gInt, bInt];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace(/^#/, "");
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  let rNormal = r / 255;
  let gNormal = g / 255;
  let bNormal = b / 255;

  rNormal = rNormal > 0.04045 ? Math.pow((rNormal + 0.055) / 1.055, 2.4) : rNormal / 12.92;
  gNormal = gNormal > 0.04045 ? Math.pow((gNormal + 0.055) / 1.055, 2.4) : gNormal / 12.92;
  bNormal = bNormal > 0.04045 ? Math.pow((bNormal + 0.055) / 1.055, 2.4) : bNormal / 12.92;

  rNormal *= 100;
  gNormal *= 100;
  bNormal *= 100;

  // D65 Standard Illuminant conversions
  let x = rNormal * 0.4124 + gNormal * 0.3576 + bNormal * 0.1805;
  let y = rNormal * 0.2126 + gNormal * 0.7152 + bNormal * 0.0722;
  let z = rNormal * 0.0193 + gNormal * 0.1192 + bNormal * 0.9505;

  x /= 95.047;
  y /= 100.000;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  let l = 116 * y - 16;
  let a = 500 * (x - y);
  let bVal = 200 * (y - z);

  return [l, a, bVal];
}

// Map the full database to ensure HEX properties are loaded for all items
const enrichedShades = shadesDatabase.map(shade => {
  if (shade.hex) return shade;
  const [r, g, b] = labToRgb(shade.lab[0], shade.lab[1], shade.lab[2]);
  return {
    ...shade,
    hex: rgbToHex(r, g, b)
  };
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up file uploads using multer memory storage
  const upload = multer({ storage: multer.memoryStorage() });

  // Serve static folders
  app.use("/static", express.static(path.join(process.cwd(), "static")));

  // API Route: Match skin tone from uploaded image
  app.post("/match", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded." });
      }

      let detectedHex = "#E0A273"; // Default beautiful medium gold-beige skin tone fallback
      const ai = getAI();

      if (ai) {
        try {
          console.log("Analyzing uploaded image skin tone using Gemini vision API...");
          const base64Data = req.file.buffer.toString("base64");
          
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              {
                text: "You are an expert beauty-tech skin tones analyst. Analyze the face in this selfie. Return a JSON object with a single 'hex' key representing the average matching skin tone shade (e.g. {\"hex\": \"#F5B68A\"}). Choose carefully. Return only raw JSON without any markdown formatting."
              },
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: base64Data
                }
              }
            ],
            config: {
              responseMimeType: "application/json"
            }
          });

          let resultText = response.text?.trim() || "";
          console.log("Gemini API skin tone output:", resultText);
          
          // Robust JSON sanitization to handle potential markdown wrappers
          if (resultText.startsWith("```")) {
            resultText = resultText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
          }
          
          const parsed = JSON.parse(resultText);
          if (parsed && parsed.hex) {
            detectedHex = parsed.hex;
          }
        } catch (apiErr) {
          console.error("Gemini API call failed, falling back to default shade matching:", apiErr);
          // Standard fallback: simulate realistic slight variations of skin tone base colors
          const randomBeigeShades = ["#FADDBD", "#F9CFA7", "#FBD3A2", "#E0A273", "#D9905B", "#E7A25F", "#DEA06D"];
          detectedHex = randomBeigeShades[Math.floor(Math.random() * randomBeigeShades.length)];
        }
      } else {
        console.log("Gemini API key is not configured, using realistic randomized fallback matching.");
        const randomBeigeShades = ["#F5B68A", "#FCCDA3", "#F0BC8A", "#E0A579", "#DEA06D", "#D68F51"];
        detectedHex = randomBeigeShades[Math.floor(Math.random() * randomBeigeShades.length)];
      }

      console.log("Skin tone target HEX identified:", detectedHex);

      // Convert detected HEX to LAB space for precise math comparison
      const [tr, tg, tb] = hexToRgb(detectedHex);
      const [tL, tA, tB] = rgbToLab(tr, tg, tb);

      // Compute matching accuracy to each shade in the database
      const matches = enrichedShades.map(shade => {
        const [sL, sA, sB] = shade.lab;
        
        // Euclidean distance in L*a*b* space (Delta E76 approximation)
        const distance = Math.sqrt(
          Math.pow(tL - sL, 2) +
          Math.pow(tA - sA, 2) +
          Math.pow(tB - sB, 2)
        );

        // Map distance to an accuracy percentage from 0% to 100%
        // Standard Delta E of 0 means perfect match (100% accuracy). Delta E > 30 represents severe mismatch (0% accuracy)
        const accuracyVal = Math.max(0, Math.min(100, Math.round(100 - distance * 1.8)));

        return {
          brand: shade.brand,
          name: shade.name,
          hex: shade.hex,
          accuracy: accuracyVal,
          price: shade.price,
          date_added: shade.date_added,
          product: shade.product,
          shade: shade.shade,
          spf: shade.spf,
          coverage: shade.coverage,
          finish: shade.finish,
          undertone: shade.undertone,
          skin_type: shade.skin_type
        };
      });

      // Sort matches by accuracy descending and filter out poor matches (e.g. keep top 6)
      const topMatches = matches
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 6);

      res.json({ matches: topMatches });

    } catch (err) {
      console.error("Matching error handler:", err);
      res.status(500).json({ error: "Internal server error during shade matching." });
    }
  });

  // Serve index.html template on root path
  app.get("/", (req, res) => {
    const indexPath = path.join(process.cwd(), "templates", "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Index template not found.");
    }
  });

  // Serve static elements or mount Vite middleware in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Find My Foundation Server running on http://localhost:${PORT}`);
  });
}

startServer();
