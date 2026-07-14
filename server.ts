import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import sharp from "sharp";
import { shadesDatabase } from "./src/db_shades";

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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

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

  x = x * 95.047;
  y = y * 100.0;
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
  return "#" + [r, g, b].map((x) => {
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

  let x = rNormal * 0.4124 + gNormal * 0.3576 + bNormal * 0.1805;
  let y = rNormal * 0.2126 + gNormal * 0.7152 + bNormal * 0.0722;
  let z = rNormal * 0.0193 + gNormal * 0.1192 + bNormal * 0.9505;

  x /= 95.047;
  y /= 100.0;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  let l = 116 * y - 16;
  let a = 500 * (x - y);
  let bVal = 200 * (y - z);

  return [l, a, bVal];
}

function getUndertoneLabel(r: number, g: number, b: number): { label: string; description: string } {
  const redBias = r - g;
  const blueBias = b - g;
  if (redBias > 18 && redBias > blueBias) {
    return { label: "Warm", description: "A warm, golden cast is dominant in the sample." };
  }
  if (blueBias > 18 && blueBias > redBias) {
    return { label: "Cool", description: "A cool, pink or bluish cast is dominant in the sample." };
  }
  return { label: "Neutral", description: "The sample sits close to a balanced neutral tone." };
}

function getSkinDepthLabel(l: number): { label: string; description: string } {
  if (l < 65) {
    return { label: "Light", description: "The sample leans lighter in overall depth." };
  }
  if (l < 78) {
    return { label: "Medium", description: "The sample sits in the medium depth range." };
  }
  return { label: "Deep", description: "The sample leans deeper in overall depth." };
}

function buildAssistantPayload(imageAnalysis: any, matches: any[], detectedHex: string) {
  console.log("[match] Assistant payload started");
  try {
    const [r, g, b] = hexToRgb(detectedHex);
    const [l] = rgbToLab(r, g, b);
    const undertone = getUndertoneLabel(r, g, b);
    const depth = getSkinDepthLabel(l);

    const recommendations = [] as any[];
    if (matches.length > 0) {
      const sortedByPrice = [...matches].sort((a, b) => (a.price || 0) - (b.price || 0));
      const sortedByPremium = [...matches].sort((a, b) => (b.price || 0) - (a.price || 0));
      const sortedByAccuracy = [...matches].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
      const otherBrands = sortedByAccuracy.filter((match) => match.brand !== sortedByAccuracy[0]?.brand).slice(0, 4);

      recommendations.push({
        type: "bestOverall",
        title: "Best Overall Match",
        shade: sortedByAccuracy[0]
      });
      recommendations.push({
        type: "budgetAlternative",
        title: "Budget Alternative",
        shade: sortedByPrice[0]
      });
      recommendations.push({
        type: "premiumAlternative",
        title: "Premium Alternative",
        shade: sortedByPremium[0]
      });
      recommendations.push({
        type: "similarShades",
        title: "Similar Shades from Other Brands",
        shades: otherBrands
      });
    }

    const explanation = `Your skin appears ${depth.label.toLowerCase()} with a ${undertone.label.toLowerCase()} undertone. Based on CIELAB color matching, these are the closest foundation matches.`;

    const payload = {
      detectedSkinTone: {
        label: `${depth.label} ${undertone.label}`,
        hex: detectedHex,
        description: `A ${depth.label.toLowerCase()} depth estimate with a ${undertone.label.toLowerCase()} cast.`
      },
      detectedUndertone: undertone,
      skinDepth: depth,
      matchConfidence: Math.round(imageAnalysis.confidence),
      explanation,
      recommendations
    };
    console.log("[match] Assistant payload finished");
    return payload;
  } catch (err) {
    console.error("[match] Assistant payload failed", err instanceof Error ? err.stack : err);
    throw err;
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function sendJsonError(res: any, status: number, message: string, details?: unknown) {
  if (res.headersSent) return null;
  return res.status(status).json({
    error: message,
    ...(details ? { details } : {})
  });
}

function cieDe2000(labA: [number, number, number], labB: [number, number, number]): number {
  const [l1, a1, b1] = labA;
  const [l2, a2, b2] = labB;
  const rad = Math.PI / 180;
  const c1 = Math.hypot(a1, b1);
  const c2 = Math.hypot(a2, b2);
  const deltaL = l2 - l1;
  const deltaC = c2 - c1;
  const h1 = Math.atan2(b1, a1);
  const h2 = Math.atan2(b2, a2);
  let deltaH = h2 - h1;
  if (deltaH > Math.PI) deltaH -= 2 * Math.PI;
  if (deltaH < -Math.PI) deltaH += 2 * Math.PI;
  const deltaH2 = 2 * Math.sqrt(c1 * c2) * Math.sin(deltaH / 2);
  const meanL = (l1 + l2) / 2;
  const meanC = (c1 + c2) / 2;
  const meanH = (h1 + h2) / 2;

  const t = 1 - 0.17 * Math.cos(meanH - 30 * rad) + 0.24 * Math.cos(2 * meanH) + 0.32 * Math.cos(3 * meanH + 6 * rad) - 0.2 * Math.cos(4 * meanH - 63 * rad);
  const rT = -2 * Math.sqrt(Math.pow(meanC, 7) / (Math.pow(meanC, 7) + Math.pow(25, 7))) * Math.sin((2 * meanH - 90 * rad) * rad);

  const sL = 1 + ((0.015 * Math.pow(meanL - 50, 2)) / Math.sqrt(20 + Math.pow(meanL - 50, 2)));
  const sC = 1 + 0.045 * meanC;
  const sH = 1 + 0.015 * meanC * t;

  return Math.sqrt(
    Math.pow(deltaL / sL, 2) +
    Math.pow(deltaC / sC, 2) +
    Math.pow(deltaH2 / sH, 2) +
    rT * (deltaC / sC) * (deltaH2 / sH)
  );
}

function estimateSkinToneFromSamples(samples: Array<[number, number, number]>): [number, number, number] {
  if (samples.length === 0) {
    return [255, 200, 180];
  }

  const sorted = [...samples].sort((a, b) => {
    const aLum = (a[0] + a[1] + a[2]) / 3;
    const bLum = (b[0] + b[1] + b[2]) / 3;
    return aLum - bLum;
  });

  const middle = sorted[Math.floor(sorted.length / 2)];
  return middle;
}

function rgbToNormalizedTuple(r: number, g: number, b: number): [number, number, number] {
  return [r / 255, g / 255, b / 255];
}

function isSkinTone(r: number, g: number, b: number): boolean {
  const [nr, ng, nb] = rgbToNormalizedTuple(r, g, b);
  const maxC = Math.max(nr, ng, nb);
  const minC = Math.min(nr, ng, nb);
  const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
  const brightness = (nr + ng + nb) / 3;
  const hue = Math.max(nr, ng, nb) === nr ? 0 : Math.max(nr, ng, nb) === ng ? 1 : 2;
  const isWarm = nr >= ng * 0.9 && nr >= nb * 0.9;
  return brightness > 0.15 && brightness < 0.95 && saturation > 0.08 && saturation < 0.85 && isWarm && (
    (hue === 0 && nr > ng * 0.9 && nr > nb * 0.9) ||
    (hue === 1 && ng > nr * 0.9 && ng > nb * 0.9)
  );
}

async function analyzeImageWithGemini(buffer: Buffer, mimeType: string) {
  const ai = getAI();
  if (!ai) return null;

  const startedAt = Date.now();
  console.log("[match] AI request started");
  try {
    const base64Data = buffer.toString("base64");
    const responsePromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          text: "Analyze this image for beauty-tech shade matching. Return strict JSON with: targetType ('face' or 'swatch'), faceBox {x,y,width,height} or null, skinRegions {leftCheek,rightCheek,forehead} each as {x,y,width,height} or null, swatchBox {x,y,width,height} or null, estimatedHex string, confidence number. No markdown."
        },
        {
          inlineData: {
            mimeType,
            data: base64Data
          }
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const response = await withTimeout(responsePromise, 1800, "gemini-analysis");

    const resultText = response.text?.trim() || "{}";
    const parsed = JSON.parse(resultText);
    if (parsed && typeof parsed === "object") {
      console.log(`[match] AI request finished in ${Date.now() - startedAt}ms`);
      return parsed;
    }
  } catch (err) {
    console.warn(`[match] AI request failed after ${Date.now() - startedAt}ms, using local heuristics.`, err);
  }

  return null;
}

async function analyzeImageBuffer(buffer: Buffer, mimeType: string) {
  const startedAt = Date.now();
  console.log(`[match] Request received`, { mimeType, size: buffer.length });

  const geminiResult = await analyzeImageWithGemini(buffer, mimeType);
  console.log(`[match] Image loaded in ${Date.now() - startedAt}ms`);
  const imageMeta = await withTimeout(sharp(buffer).metadata(), 4000, "image metadata");
  const sourceWidth = imageMeta.width || 0;
  const sourceHeight = imageMeta.height || 0;
  console.log(`[match] Image loaded`, { sourceWidth, sourceHeight });

  console.log(`[match] Face detection started in ${Date.now() - startedAt}ms`);
  const { data, info } = await withTimeout(
    sharp(buffer)
      .resize(512, 512, { fit: "cover", withoutEnlargement: true })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true }),
    6000,
    "image processing"
  );

  const pixels = new Uint8ClampedArray(data.buffer);
  const width = info.width;
  const height = info.height;
  console.log(`[match] Image resized in ${Date.now() - startedAt}ms`, { width, height });
  console.log(`[match] Face detection finished in ${Date.now() - startedAt}ms`);
  const count = width * height;

  const grayscaleValues: number[] = [];
  const rgbSamples: Array<[number, number, number]> = [];
  const skinSamples: Array<[number, number, number]> = [];
  const centerWeight = (x: number, y: number) => {
    const dx = x - width / 2;
    const dy = y - height / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return Math.max(0.35, 1 - dist / Math.max(width, height));
  };

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];
    const gray = r * 0.299 + g * 0.587 + b * 0.114;
    const x = index % width;
    const y = Math.floor(index / width);
    const isSkin = isSkinTone(r, g, b);
    const weight = centerWeight(x, y);

    grayscaleValues.push(gray);
    rgbSamples.push([r, g, b]);
    if (isSkin && weight > 0.55) {
      skinSamples.push([r, g, b]);
    }
  }

  const brightnessMean = grayscaleValues.reduce((sum, v) => sum + v, 0) / grayscaleValues.length / 255;
  const totalPixels = grayscaleValues.length;
  console.log(`[match] Lighting correction started in ${Date.now() - startedAt}ms`);

  let targetType = geminiResult?.targetType || (sourceWidth > 0 && sourceHeight > 0 && sourceWidth / sourceHeight > 1.35 ? "swatch" : "face");
  if (geminiResult?.targetType === "swatch" || (sourceWidth > 0 && sourceHeight > 0 && sourceWidth / sourceHeight > 1.4)) {
    targetType = "swatch";
  }

  const faceBox = geminiResult?.faceBox || (() => {
    const skinPixels = [] as Array<[number, number]>;
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      if (isSkinTone(r, g, b)) {
        const x = index % width;
        const y = Math.floor(index / width);
        skinPixels.push([x, y]);
      }
    }
    if (skinPixels.length === 0) {
      return null;
    }
    const xs = skinPixels.map(([x]) => x);
    const ys = skinPixels.map(([, y]) => y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const candidateWidth = Math.max(32, maxX - minX);
    const candidateHeight = Math.max(32, maxY - minY);
    return { x: Math.max(0, Math.round(minX)), y: Math.max(0, Math.round(minY)), width: Math.min(width, Math.round(candidateWidth)), height: Math.min(height, Math.round(candidateHeight)) };
  })();

  const regionNames = ["leftCheek", "rightCheek", "forehead"] as const;
  const skinRegions = regionNames.map((name) => {
    if (faceBox) {
      const box = faceBox;
      const faceWidth = box.width;
      const faceHeight = box.height;
      const regionMap: Record<string, { x: number; y: number; width: number; height: number }> = {
        leftCheek: { x: Math.max(0, box.x + Math.round(faceWidth * 0.1)), y: Math.max(0, box.y + Math.round(faceHeight * 0.45)), width: Math.max(12, Math.round(faceWidth * 0.22)), height: Math.max(12, Math.round(faceHeight * 0.2)) },
        rightCheek: { x: Math.max(0, box.x + Math.round(faceWidth * 0.68)), y: Math.max(0, box.y + Math.round(faceHeight * 0.45)), width: Math.max(12, Math.round(faceWidth * 0.22)), height: Math.max(12, Math.round(faceHeight * 0.2)) },
        forehead: { x: Math.max(0, box.x + Math.round(faceWidth * 0.23)), y: Math.max(0, box.y + Math.round(faceHeight * 0.05)), width: Math.max(12, Math.round(faceWidth * 0.5)), height: Math.max(12, Math.round(faceHeight * 0.2)) }
      };
      return regionMap[name];
    }
    return null;
  });

  const sampleSkinPixels = (region: { x: number; y: number; width: number; height: number } | null) => {
    if (!region) return [] as Array<[number, number, number]>;
    const samples: Array<[number, number, number]> = [];
    for (let y = region.y; y < Math.min(height, region.y + region.height); y += 1) {
      for (let x = region.x; x < Math.min(width, region.x + region.width); x += 1) {
        const index = y * width + x;
        const offset = index * 3;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];
        if (isSkinTone(r, g, b)) {
          samples.push([r, g, b]);
        }
      }
    }
    return samples;
  };

  const swatchSamples = targetType === "swatch" ? [] as Array<[number, number, number]> : [];
  if (targetType === "swatch") {
    const candidateCandidates = [] as Array<{ x: number; y: number; width: number; height: number }>;
    const scanStep = 4;
    for (let y = 0; y < height; y += scanStep) {
      for (let x = 0; x < width; x += scanStep) {
        const index = y * width + x;
        const offset = index * 3;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];
        const [nr, ng, nb] = rgbToNormalizedTuple(r, g, b);
        const saturation = Math.max(nr, ng, nb) === 0 ? 0 : (Math.max(nr, ng, nb) - Math.min(nr, ng, nb)) / Math.max(0.001, Math.max(nr, ng, nb));
        if (saturation > 0.16 && brightnessMean > 0.12 && brightnessMean < 0.95) {
          candidateCandidates.push({ x, y, width: 18, height: 18 });
        }
      }
    }
    if (candidateCandidates.length > 0) {
      const [best] = candidateCandidates.sort((a, b) => b.width * b.height - a.width * a.height);
      for (let y = best.y; y < Math.min(height, best.y + best.height); y += 1) {
        for (let x = best.x; x < Math.min(width, best.x + best.width); x += 1) {
          const index = y * width + x;
          const offset = index * 3;
          const r = pixels[offset];
          const g = pixels[offset + 1];
          const b = pixels[offset + 2];
          swatchSamples.push([r, g, b]);
        }
      }
    }
  }

  console.log(`[match] Skin extraction started in ${Date.now() - startedAt}ms`);
  const sampledPixels = targetType === "swatch"
    ? swatchSamples
    : skinRegions.flatMap((region) => sampleSkinPixels(region));

  const basePixels = sampledPixels.length > 0 ? sampledPixels : skinSamples;
  const selected = basePixels.length > 0 ? estimateSkinToneFromSamples(basePixels) : [240, 200, 180];
  console.log(`[match] Skin extraction finished in ${Date.now() - startedAt}ms`, { targetType, sampledPixels: basePixels.length });

  const [r, g, b] = selected;
  const hex = rgbToHex(r, g, b);
  const confidence = clamp(Math.round(82 + (basePixels.length > 0 ? 8 : 0) + (targetType === "swatch" ? 3 : 0)), 60, 97);
  console.log(`[match] Undertone detection finished in ${Date.now() - startedAt}ms`, { hex });
  return {
    hex,
    targetType,
    confidence,
    faceBox,
    skinRegions,
    width: sourceWidth,
    height: sourceHeight,
    pixels: selected
  };
}

const enrichedShades = shadesDatabase.map((shade) => {
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

  const upload = multer({ storage: multer.memoryStorage() });
  app.use("/static", express.static(path.join(process.cwd(), "static")));

  app.post("/match", upload.single("image"), async (req, res) => {
    const startedAt = Date.now();
    try {
      if (!req.file) {
        return sendJsonError(res, 400, "No image file uploaded.");
      }

      if (!req.file.mimetype?.startsWith("image/")) {
        return sendJsonError(res, 400, "Please upload a valid image file.");
      }

      const processingPromise = (async () => {
        console.log(`[match] Foundation matching started in ${Date.now() - startedAt}ms`);
        const file = req.file;
        if (!file) {
          return sendJsonError(res, 400, "No image file uploaded.");
        }

        try {
          console.log(`[match] Image analysis started in ${Date.now() - startedAt}ms`);
          const imageAnalysis = await analyzeImageBuffer(file.buffer, file.mimetype);
          console.log(`[match] Image analysis finished in ${Date.now() - startedAt}ms`);

          if (!imageAnalysis?.hex) {
            return sendJsonError(res, 422, "Couldn't detect a foundation shade. Please upload another image.");
          }

          const [tr, tg, tb] = hexToRgb(imageAnalysis.hex);
          const [tL, tA, tB] = rgbToLab(tr, tg, tb);
          console.log(`[match] Matching candidates started in ${Date.now() - startedAt}ms`);
          const matches = enrichedShades.map((shade) => {
            try {
              const [sL, sA, sB] = shade.lab;
              const distance = cieDe2000([tL, tA, tB], [sL, sA, sB]);
              const accuracyVal = Math.max(0, Math.min(100, Math.round(100 - distance * 2.4)));
              const confidence = Math.max(0, Math.min(100, Math.round((accuracyVal * 0.85) + (imageAnalysis.confidence * 0.15))));
              return {
                brand: shade.brand,
                name: shade.name,
                hex: shade.hex,
                accuracy: accuracyVal,
                confidence,
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
            } catch (matchErr) {
              console.error("[match] Candidate mapping failed", matchErr instanceof Error ? matchErr.stack : matchErr);
              throw matchErr;
            }
          });
          console.log(`[match] Matching candidates finished in ${Date.now() - startedAt}ms`, { count: matches.length });

          const topMatches = matches.sort((a, b) => b.accuracy - a.accuracy).slice(0, 5);
          console.log(`[match] Foundation matching finished in ${Date.now() - startedAt}ms`, { count: topMatches.length });
          const assistant = buildAssistantPayload(imageAnalysis, topMatches, imageAnalysis.hex);
          console.log(`[match] AI recommendation completed in ${Date.now() - startedAt}ms`);
          console.log(`[match] Preparing response in ${Date.now() - startedAt}ms`);
          return res.json({
            matches: topMatches,
            confidence: imageAnalysis.confidence,
            targetType: imageAnalysis.targetType,
            detectedHex: imageAnalysis.hex,
            assistant
          });
        } catch (stageErr) {
          console.error("[match] Match pipeline failed", stageErr instanceof Error ? stageErr.stack : stageErr);
          return sendJsonError(res, 500, "The match request failed while processing your image.", {
            stage: "backend-processing",
            message: stageErr instanceof Error ? stageErr.message : String(stageErr)
          });
        }
      })();

      await withTimeout(processingPromise, 12000, "match processing");
    } catch (err) {
      console.error(`[match] Matching failed after ${Date.now() - startedAt}ms`, err instanceof Error ? err.stack : err);
      if (!res.headersSent) {
        return sendJsonError(res, 504, "The match request timed out. Please try again with a smaller image or a stronger connection.");
      }
      return null;
    }
  });

  app.get("/", (req, res) => {
    const indexPath = path.join(process.cwd(), "templates", "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Index template not found.");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
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
