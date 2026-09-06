import type { IncomingMessage, ServerResponse } from "node:http";

const SYSTEM_PROMPT = `You interpret Indian railway journey incident reports for a refund-guidance prototype.
Handle English and Hindi-English code-mixed (Hinglish / Roman Hindi) inputs accurately.

Output ONLY compact JSON, no markdown, matching this shape:
{"facts":{"incidentType":"delay_not_travelled|could_not_board|travelled_disrupted|partial_journey|travelled_completed|ambiguous","passengerTravelled":true|false|"unknown","passengerBoarded":true|false|"unknown","journeyCompleted":true|false|"unknown","partialJourney":true|false|"unknown","delayDuration":"lt3h|3to6h|gt6h|unsure","cancelledBeforeDeparture":true|false|"unknown","disruptionMentioned":string|null,"journeyDateMentioned":string|null},"confidence":0.8,"summary":"one short plain sentence summarizing what happened"}

RULES & HINGLISH UNDERSTANDING:
1. CODE-MIXED EXAMPLES:
   - "Train bahut late thi, isliye maine travel nahi kiya" -> incidentType: "delay_not_travelled", passengerTravelled: false, delayDuration: "3to6h", disruptionMentioned: "Train delayed".
   - "Main train mein chadh gaya tha, but aadhe raste mein journey disrupt ho gayi" -> incidentType: "partial_journey", passengerBoarded: true, passengerTravelled: true, journeyCompleted: false, partialJourney: true, disruptionMentioned: "Disrupted midway".
   - "Train miss ho gayi because station pe late pahucha" -> incidentType: "could_not_board", passengerBoarded: false, passengerTravelled: false, disruptionMentioned: "Missed train (passenger reached station late)".
   - "Maine journey complete nahi ki, beech mein problem ho gayi" -> incidentType: "partial_journey", passengerBoarded: true, passengerTravelled: true, journeyCompleted: false, partialJourney: true, disruptionMentioned: "Disrupted midway".
   - "Train cancel ho gayi aur maine travel nahi kiya" -> incidentType: "delay_not_travelled", passengerTravelled: false, cancelledBeforeDeparture: true, disruptionMentioned: "Train cancelled".

2. KEY DISTINCTIONS:
   - Distinguish train delay ("train late thi", "train der se aayi") from passenger arriving late ("station pe late pahucha", "traffic mein fas gaya").
   - Distinguish missed train ("train miss ho gayi", "chhut gayi") from cancelled train ("train cancel ho gayi", "radd ho gayi").
   - Distinguish did-not-travel ("travel nahi kiya", "board nahi kiya") from partial journey ("aadhe raste mein", "beech mein", "journey complete nahi hui").
   - If travel status is unclear, set passengerTravelled: "unknown" and incidentType: "ambiguous". Never invent missing facts.`;

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
