/**
 * Cloudflare Worker para Le Fabrique Costa Rica
 * - Sirve los archivos estáticos (index.html, fotos/*, promociones-studio.js)
 * - Endpoint /api/generate-image: Traduce términos textiles de Costa Rica (filipina, gabacha, scrub, cargo, oxford, polo)
 *   y genera fotografía publicitaria fotorrealista con Cloudflare Workers AI (Flux-1-Schnell).
 */

const CR_TEXTILE_GLOSSARY = [
  { pattern: /\bfilipinas?\s+m[eé]dicas?\b/gi, replacement: "tailored medical clinical tunic scrub top" },
  { pattern: /\bfilipinas?\b/gi, replacement: "double-breasted professional chef jacket coat" },
  { pattern: /\bgabachas?\b/gi, replacement: "professional tailored medical doctor lab coat" },
  { pattern: /\bscrubs?\b/gi, replacement: "clinical medical scrubs uniform set (V-neck scrub top and pants)" },
  { pattern: /\btrajes?\s+m[eé]dicos?\b/gi, replacement: "clinical medical scrubs uniform set" },
  { pattern: /\bpantal[oó]n(?:es)?\s+cargo\b/gi, replacement: "heavy-duty industrial cargo work trousers with side utility pockets" },
  { pattern: /\bchalecos?\s+reflectivos?\b/gi, replacement: "high-visibility industrial safety work vest with reflective bands" },
  { pattern: /\bchalecos?\s+t[aá]cticos?\b/gi, replacement: "multi-pocket industrial utility tactical work vest" },
  { pattern: /\bcamisas?\s+oxford\b/gi, replacement: "tailored corporate Oxford button-down dress shirt" },
  { pattern: /\bcamisas?\s+ejecutivas?\b/gi, replacement: "tailored slim-fit corporate executive button-down dress shirt" },
  { pattern: /\bblusas?\s+ejecutivas?\b/gi, replacement: "tailored women corporate executive dress blouse" },
  { pattern: /\bcamisetas?\s+polo\b/gi, replacement: "corporate embroidered piqué polo shirt with collar" },
  { pattern: /\bpolos?\s+piqu[eé]\b/gi, replacement: "corporate piqué knit polo shirt with collar" },
  { pattern: /\bdelantal(?:es)?\b/gi, replacement: "professional culinary chef canvas apron" },
  { pattern: /\bbordados?\b/gi, replacement: "high-definition computer embroidered logo" }
];

function applyTextileGlossary(text) {
  let out = text;
  for (const rule of CR_TEXTILE_GLOSSARY) {
    out = out.replace(rule.pattern, rule.replacement);
  }
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // Endpoint de Generación Fotográfica con IA
    if (url.pathname === "/api/generate-image") {
      try {
        let userPrompt = url.searchParams.get("prompt") || "";
        let category = url.searchParams.get("category") || "ejecutivo";

        if (request.method === "POST") {
          const body = await request.json().catch(() => ({}));
          if (body.prompt) userPrompt = body.prompt;
          if (body.category) category = body.category;
        }

        userPrompt = (userPrompt || "Uniforme corporativo ejecutivo").trim();
        const preProcessed = applyTextileGlossary(userPrompt);

        let englishPrompt = preProcessed;

        // 1. Traducir y enriquecer el prompt con Llama 3.1 en Workers AI para máxima precisión
        if (env.AI) {
          try {
            const llmRes = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
              messages: [
                {
                  role: "system",
                  content:
                    "You are an expert commercial fashion photography prompt engineer for a corporate uniform manufacturer in Costa Rica. " +
                    "Translate the user's garment request into a detailed English image generation prompt (max 75 words). " +
                    "IMPORTANT RULES:\n" +
                    "- 'filipina' ALWAYS means a chef coat/jacket (or medical tunic), NEVER a person from the Philippines.\n" +
                    "- 'gabacha' ALWAYS means a doctor/laboratory coat.\n" +
                    "- Keep the exact garment type, colors, gender, and environment requested by the user.\n" +
                    "- Style: Professional commercial catalog studio photoshoot, Latin American professional model, crisp fabric texture, realistic tailoring, 8k photorealistic lighting.\n" +
                    "- Output ONLY the English prompt, nothing else."
                },
                {
                  role: "user",
                  content: `User request: "${userPrompt}" (Technical glossary hint: "${preProcessed}", Category: "${category}")`
                }
              ],
              max_tokens: 160,
              temperature: 0.3
            });

            if (llmRes && llmRes.response) {
              englishPrompt = llmRes.response.trim().replace(/^["']|["']$/g, "");
            }
          } catch (llmErr) {
            console.error("LLM translation fallback:", llmErr);
          }

          // 2. Generar imagen fotorrealista con Flux-1-Schnell en Cloudflare Workers AI
          const fluxRes = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
            prompt: `${englishPrompt}, professional commercial uniform catalog photography, Latin American model, sharp textile stitching detail, high-end studio lighting, 8k photorealistic`,
            steps: 8
          });

          if (fluxRes && fluxRes.image) {
            // flux-1-schnell devuelve base64 en fluxRes.image
            const binaryStr = atob(fluxRes.image);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            return new Response(bytes, {
              headers: {
                "Content-Type": "image/jpeg",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-store",
                "X-Translated-Prompt": encodeURIComponent(englishPrompt)
              }
            });
          }
        }

        // Fallback si env.AI no está disponible
        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          englishPrompt + ", professional commercial uniform catalog photography, Latin American model, 8k photorealistic"
        )}?width=1080&height=1080&nologo=true&enhance=false&model=flux&seed=${Math.floor(Math.random() * 1000000)}`;

        const imgResp = await fetch(fallbackUrl);
        return new Response(imgResp.body, {
          headers: {
            "Content-Type": imgResp.headers.get("Content-Type") || "image/jpeg",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store"
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    // Servir archivos estáticos
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
