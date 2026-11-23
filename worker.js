/**
 * Cloudflare Worker para Le Fabrique Costa Rica
 * - Sirve los archivos estáticos (index.html, fotos/*, promociones-studio.js)
 * - Endpoint /api/generate-image: Traduce términos textiles de Costa Rica (filipina, gabacha, scrub, cargo, oxford, polo),
 *   colores y escenarios al inglés técnico y genera fotografía publicitaria fotorrealista con Cloudflare Workers AI (Flux-1-Schnell).
 */

const CR_TEXTILE_GLOSSARY = [
  // Prendas específicas de Costa Rica
  { pattern: /\bfilipinas?\s+m[eé]dicas?\b/gi, replacement: "tailored medical clinical scrub tunic top" },
  { pattern: /\bfilipinas?\s+(?:de\s+)?chefs?\b/gi, replacement: "double-breasted long-sleeve professional chef jacket coat" },
  { pattern: /\bfilipinas?\s+ejecutivas?\b/gi, replacement: "luxury double-breasted long-sleeve executive chef coat jacket" },
  { pattern: /\bfilipinas?\b/gi, replacement: "double-breasted long-sleeve professional chef coat jacket" },
  { pattern: /\bgabachas?\s+m[eé]dicas?\b/gi, replacement: "professional tailored white medical doctor lab coat" },
  { pattern: /\bgabachas?\b/gi, replacement: "professional tailored medical doctor lab coat smock" },
  { pattern: /\bscrubs?\s+m[eé]dicos?\b/gi, replacement: "tailored clinical medical scrubs uniform set (V-neck scrub top and pants)" },
  { pattern: /\bscrubs?\b/gi, replacement: "tailored clinical medical scrubs uniform set (V-neck top and pants)" },
  { pattern: /\btrajes?\s+m[eé]dicos?\b/gi, replacement: "clinical medical scrubs uniform set" },
  { pattern: /\bconjuntos?\s+cl[ií]nicos?\b/gi, replacement: "clinical medical scrubs uniform set" },
  { pattern: /\bpantal[oó]n(?:es)?\s+cargo\b/gi, replacement: "heavy-duty industrial cargo work trousers with side utility pockets" },
  { pattern: /\bpantal[oó]n(?:es)?\s+de\s+faena\b/gi, replacement: "heavy-duty industrial workwear trousers" },
  { pattern: /\bchalecos?\s+reflectivos?\b/gi, replacement: "high-visibility industrial safety work vest with 3M reflective bands" },
  { pattern: /\bchalecos?\s+t[aá]cticos?\b/gi, replacement: "multi-pocket industrial utility tactical work vest" },
  { pattern: /\bcamisas?\s+oxford\b/gi, replacement: "tailored corporate Oxford button-down dress shirt" },
  { pattern: /\bcamisas?\s+ejecutivas?\b/gi, replacement: "tailored slim-fit corporate executive button-down dress shirt" },
  { pattern: /\bblusas?\s+ejecutivas?\b/gi, replacement: "tailored women corporate executive dress blouse" },
  { pattern: /\bblusas?\s+sastre\b/gi, replacement: "tailored women formal corporate dress blouse" },
  { pattern: /\bcamisetas?\s+polo\b/gi, replacement: "corporate embroidered piqué polo shirt with collar" },
  { pattern: /\bpolos?\s+piqu[eé]\b/gi, replacement: "corporate piqué knit polo shirt with collar" },
  { pattern: /\bdelantal(?:es)?\b/gi, replacement: "professional culinary chef canvas apron" },
  { pattern: /\btrajes?\s+sastre\b/gi, replacement: "bespoke tailored executive business suit and blazer" },
  // Modelos
  { pattern: /\bdoctora\b/gi, replacement: "female Latin American doctor" },
  { pattern: /\bdoctor\b|\bm[eé]dico\b/gi, replacement: "male Latin American doctor" },
  { pattern: /\benfermera\b/gi, replacement: "female Latin American nurse" },
  { pattern: /\bchef\s+profesional\b|\bchef\b|\bcocinero\b/gi, replacement: "professional Latin American master chef" },
  { pattern: /\bejecutiva\b|\bdama\b|\bmujer\b/gi, replacement: "professional Latin American corporate businesswoman" },
  { pattern: /\bejecutivo\b|\bcaballero\b|\bhombre\b/gi, replacement: "professional Latin American corporate businessman" },
  { pattern: /\boperario\b|\btrabajador\b|\bingeniero\b/gi, replacement: "professional Latin American industrial engineer worker" },
  // Colores y acabados
  { pattern: /\bazul\s+marino\b/gi, replacement: "deep navy blue" },
  { pattern: /\bazul\s+celeste\b|\bceleste\b/gi, replacement: "light sky blue" },
  { pattern: /\bazul\b/gi, replacement: "royal blue" },
  { pattern: /\bblanco\b|\bblanca\b/gi, replacement: "crisp pure white" },
  { pattern: /\bnegro\b|\bnegra\b/gi, replacement: "jet black" },
  { pattern: /\bgris\b/gi, replacement: "charcoal grey" },
  { pattern: /\bverde\s+militar\b/gi, replacement: "olive drab military green" },
  { pattern: /\bverde\s+quir[uú]rgico\b|\bverde\b/gi, replacement: "clinical surgical teal green" },
  { pattern: /\bbeige\b|\barena\b/gi, replacement: "warm sand beige" },
  { pattern: /\brojo\b|\broja\b|\bvino\b/gi, replacement: "burgundy crimson red" },
  { pattern: /\bamarillo\b|\bamarilla\b/gi, replacement: "high-visibility golden yellow" },
  { pattern: /\bribetes?\s+dorados?\b/gi, replacement: "metallic gold piping trim on collar and cuffs" },
  { pattern: /\bribetes?\s+negros?\b/gi, replacement: "black piping trim on collar and cuffs" },
  { pattern: /\bbordado\s+computarizado\b|\bbordado\b/gi, replacement: "subtle high-definition embroidered corporate emblem on chest" },
  { pattern: /\bcinta\s+reflectiva\b/gi, replacement: "3M silver-yellow reflective safety stripes" },
  { pattern: /\bantifluido\b/gi, replacement: "smooth water-repellent technical microfiber fabric" },
  { pattern: /\bdril\s+pesado\b/gi, replacement: "heavy-duty cotton twill drill fabric" },
  { pattern: /\boficina\s+moderna\b/gi, replacement: "modern bright corporate glass office background" },
  { pattern: /\bcocina\s+de\s+restaurante\b|\bcocina\b|\brestaurante\b/gi, replacement: "upscale stainless steel gourmet restaurant kitchen background" },
  { pattern: /\bcl[ií]nica\s+moderna\b|\bcl[ií]nica\b|\bhospital\b/gi, replacement: "clean modern bright medical clinic interior background" },
  { pattern: /\bvistiendo\b|\bcon\b/gi, replacement: "wearing" },
  { pattern: /\ben\b/gi, replacement: "in" },
  { pattern: /\by\b/gi, replacement: "and" }
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

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

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
        let englishPrompt = applyTextileGlossary(userPrompt);

        if (env.AI) {
          try {
            const llmRes = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
              messages: [
                {
                  role: "system",
                  content:
                    "You are an expert commercial fashion photography prompt engineer for a corporate uniform manufacturer. " +
                    "Convert the user's description into a single vivid English image generation prompt (max 65 words). " +
                    "CRITICAL: 'filipina' means a chef coat/jacket, NEVER a person from the Philippines. 'gabacha' means a medical lab coat. " +
                    "Preserve the exact garment type, colors, piping/trim details, and setting requested. Output ONLY the English prompt."
                },
                {
                  role: "user",
                  content: `Convert to English fashion photography prompt: "${englishPrompt}" (Category: ${category})`
                }
              ],
              max_tokens: 140,
              temperature: 0.2
            });

            if (llmRes && llmRes.response && llmRes.response.trim().length > 15) {
              englishPrompt = llmRes.response.trim().replace(/^["']|["']$/g, "");
            }
          } catch (llmErr) {
            // Continuar con el glosario técnico directo
          }

          const finalFluxPrompt = `${englishPrompt}, commercial high-end corporate uniform catalog photoshoot, professional Latin American model, realistic tailored textile fabric texture, sharp studio lighting, 8k photorealistic`;

          const fluxRes = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
            prompt: finalFluxPrompt,
            steps: 8
          });

          if (fluxRes && fluxRes.image) {
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

        const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          englishPrompt + ", commercial uniform catalog photography, Latin American model, 8k photorealistic"
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

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
