import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Server-side AI proxy for local development.
 *
 * Activates only when OPENAI_API_KEY is present in the environment that starts
 * Vite. The key stays on the server; the frontend talks to /api/analyze. With
 * no key configured, this route returns 503 and the client falls back to the
 * deterministic parser — the demo never breaks.
 *
 * NOTE: this is a hackathon-grade local proxy, not a hardened production API.
 */

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

const SYSTEM_PROMPT = `You interpret Indian railway journey incident reports for a refund-guidance prototype.
Return ONLY compact JSON, no markdown, matching this shape:
{"facts":{"incidentType":"delay_not_travelled|could_not_board|travelled_disrupted|ambiguous","passengerTravelled":true|false|"unknown","passengerBoarded":true|false|"unknown","delayDuration":"lt3h|3to6h|gt6h|unsure","cancelledBeforeDeparture":true|false|"unknown","disruptionMentioned":string|null,"journeyDateMentioned":string|null},"confidence":0.8,"summary":"one short plain sentence summarizing what happened"}
Rules: set unknown when the text does not clearly state a fact. Do not invent dates, PNRs, or station names. "ambiguous" only when nothing about the incident is inferable.`;

export function openAiProxyPlugin(): Plugin {
  return {
    name: "openai-analyze-proxy",
    configureServer(server) {
      const apiKey = process.env.OPENAI_API_KEY;

      server.middlewares.use("/api/analyze", (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "POST only" }));
          return;
        }

        // No key configured: tell the client (which silently falls back to
        // the deterministic parser) without leaking any error detail.
        if (!apiKey) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ configured: false }));
          return;
        }
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
          try {
            const { text } = JSON.parse(body || "{}");
            if (typeof text !== "string" || !text.trim()) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "text required" }));
              return;
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);
            const apiRes = await fetch(
              "https://api.openai.com/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model: "gpt-4o-mini",
                  temperature: 0,
                  response_format: { type: "json_object" },
                  messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: text.slice(0, 2000) },
                  ],
                }),
                signal: controller.signal,
              },
            );
            clearTimeout(timeout);

            if (!apiRes.ok) {
              res.statusCode = 502;
              res.end(JSON.stringify({ error: "upstream error" }));
              return;
            }
            const json = (await apiRes.json()) as ChatCompletionResponse;
            const content = json.choices?.[0]?.message?.content ?? "";
            const parsed = JSON.parse(content);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(parsed));
          } catch {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: "analysis failed" }));
          }
        });
      });

      if (apiKey) {
        console.log(
          "  [tdr-sahayak] OPENAI_API_KEY detected — /api/analyze is live.",
        );
      }
    },
  };
}
