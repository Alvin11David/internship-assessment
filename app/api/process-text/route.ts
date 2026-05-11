import { NextRequest, NextResponse } from "next/server";
import {
  extractTextResponse,
  resolveLanguageName,
  sunbirdFormPost,
  sunbirdPost,
} from "../sunbird";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, target_language } = body;

    if (!text || !target_language) {
      return NextResponse.json(
        { error: "Missing required fields: text, target_language" },
        { status: 400 },
      );
    }

    const summaryResponse =
      text.length > 100
        ? await sunbirdFormPost("/tasks/sunflower_simple", {
            instruction: `Summarize the following text concisely:\n\n${text}`,
            model_type: "qwen",
            temperature: "0.3",
          })
        : null;

    if (summaryResponse && !summaryResponse.ok) {
      const errorData = await summaryResponse.text();
      return NextResponse.json(
        { error: errorData || "Failed to summarize text" },
        { status: summaryResponse.status },
      );
    }

    const summaryPayload = summaryResponse
      ? await summaryResponse.json()
      : null;
    const summary = summaryResponse
      ? extractTextResponse(summaryPayload, text.slice(0, 100))
      : text;

    const targetName = resolveLanguageName(target_language);

    const translationResponse = await sunbirdFormPost(
      "/tasks/sunflower_simple",
      {
        instruction: `Translate '${summary}' to ${targetName}`,
        model_type: "qwen",
        temperature: "0.1",
      },
    );

    if (!translationResponse.ok) {
      const errorData = await translationResponse.text();
      return NextResponse.json(
        { error: errorData || "Failed to translate text" },
        { status: translationResponse.status },
      );
    }

    const translationPayload = await translationResponse.json();
    const translated = extractTextResponse(translationPayload, summary);

    const ttsResponse = await sunbirdPost("/tasks/modal/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: translated,
        response_mode: "url",
      }),
    });

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.text();
      return NextResponse.json(
        { error: errorData || "Failed to generate audio" },
        { status: ttsResponse.status },
      );
    }

    const audioPayload = await ttsResponse.json();

    return NextResponse.json({
      input: text,
      target_language,
      pipeline: {
        summary,
        translation: translated,
        audio: audioPayload,
      },
    });
  } catch (error) {
    console.error("Error processing text:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process text",
      },
      { status: 500 },
    );
  }
}
