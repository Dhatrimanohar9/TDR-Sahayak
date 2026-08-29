import type { IncomingMessage, ServerResponse } from "node:http";

const SYSTEM_PROMPT = `You interpret Indian railway journey incident reports for a refund-guidance prototype.
Return ONLY compact JSON, no markdown, matching this shape:
{"facts":{"incidentType":"delay_not_travelled|could_not_board|travelled_disrupted|ambiguous","passengerTravelled":true|false|"unknown","passengerBoarded":true|false|"unknown","delayDuration":"lt3h|3to6h|gt6h|unsure","cancelledBeforeDeparture":true|false|"unknown","disruptionMentioned":string|null,"journeyDateMentioned":string|null},"confidence":0.8,"summary":"one short plain sentence summarizing what happened"}
Rules: set unknown when the text does not clearly state a fact. Do not invent dates, PNRs, or station names. "ambiguous" only when nothing about the incident is inferable.`;

interface ReqWithBody extends IncomingMessage {
  body?: unknown;
}

export default async function handler(req: ReqWithBody, res: ServerResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "POST only" }));
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ configured: false }));
    return;
  }

  try {
    let text = "";
    if (req.body && typeof req.body === "object") {
      text = (req.body as { text?: string }).text || "";
    } else if (typeof req.body === "string") {
      try {
        text = JSON.parse(req.body).text || "";
      } catch {
        text = "";
      }
    }

    if (!text) {
      const rawBody = await new Promise<string>((resolve) => {
        let b = "";
        const timer = setTimeout(() => resolve(b), 1000);
        req.on("data", (chunk) => (b += chunk));
        req.on("end", () => {
          clearTimeout(timer);
          resolve(b);
        });
      });
      if (rawBody) {
        try {
          text = JSON.parse(rawBody).text || "";
        } catch {
          text = "";
        }
      }
    }

    if (!text || !text.trim()) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "text required" }));
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });
    clearTimeout(timeout);

    if (!apiRes.ok) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "upstream error" }));
      return;
    }

    const json = (await apiRes.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(parsed));
  } catch {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "analysis failed" }));
  }
}
