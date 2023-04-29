import { NextRequest } from "next/server";
import FormData from "form-data";

const OPENAI_URL = "api.openai.com";
const DEFAULT_PROTOCOL = "https";
const PROTOCOL = process.env.PROTOCOL ?? DEFAULT_PROTOCOL;
const BASE_URL = process.env.BASE_URL ?? OPENAI_URL;

export async function requestOpenai(req: NextRequest) {
  const apiKey = req.headers.get("token");
  const openaiPath = req.headers.get("path");

  let baseUrl = BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `${PROTOCOL}://${baseUrl}`;
  }

  console.log("[Proxy] ", openaiPath);
  console.log("[Base Url]", baseUrl);

  if (process.env.OPENAI_ORG_ID) {
    console.log("[Org ID]", process.env.OPENAI_ORG_ID);
  }

  if (openaiPath?.match("transcriptions")) {
    const form = new FormData();
    form.append("model", "whisper-1");
    form.append("language", "zh");

    const json = await req.json();
    const audio64 = json["audio64"];
    const bytes = Buffer.from(audio64, "base64");
    form.append(
      "file",
      new Blob([bytes], { type: "audio/webm;codecs=opus" }),
      `${Math.random()}.webm`,
    );

    return fetch(`${baseUrl}/${openaiPath}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(process.env.OPENAI_ORG_ID && {
          "OpenAI-Organization": process.env.OPENAI_ORG_ID,
        }),
      },
      method: req.method,
      body: form,
    });
  } else {
    return fetch(`${baseUrl}/${openaiPath}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(process.env.OPENAI_ORG_ID && {
          "OpenAI-Organization": process.env.OPENAI_ORG_ID,
        }),
      },
      method: req.method,
      body: req.body,
    });
  }
}
