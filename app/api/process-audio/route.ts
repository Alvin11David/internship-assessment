import { NextRequest, NextResponse } from "next/server";
import {
  extractTextResponse,
  resolveLanguageName,
  sunbirdJsonPost,
  sunbirdPost,
} from "../sunbird";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const targetLanguage = formData.get("target_language") as string;

    if (!audioFile || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing required fields: audio, target_language" },
        { status: 400 },
      );
    }

    const transcriptionFormData = new FormData();
    transcriptionFormData.append("audio", audioFile);

    const transcriptionResponse = await sunbirdPost("/tasks/stt", {
      method: "POST",
      body: transcriptionFormData,
    });

    if (!transcriptionResponse.ok) {
      const errorData = await transcriptionResponse.text();
      return NextResponse.json(
        { error: errorData || "Failed to transcribe audio" },
        { status: transcriptionResponse.status },
      );
    }

    const transcriptionPayload = await transcriptionResponse.json();
    const transcript = extractTextResponse(transcriptionPayload, "");
    const targetName = resolveLanguageName(targetLanguage);

    const summaryResponse = await sunbirdJsonPost("/tasks/sunflower_simple", {
      instruction: `Summarize the following text concisely:\n\n${transcript}`,
      model_type: "qwen",
      temperature: 0.3,
    });

    if (!summaryResponse.ok) {
      const errorData = await summaryResponse.text();
      return NextResponse.json(
        { error: errorData || "Failed to summarize transcript" },
        { status: summaryResponse.status },
      );
    }

    const summaryPayload = await summaryResponse.json();
    const summary = extractTextResponse(
      summaryPayload,
      transcript.slice(0, 100),
    );

    const translationResponse = await sunbirdJsonPost(
      "/tasks/sunflower_simple",
      {
        instruction: `Translate '${summary}' to ${targetName}`,
        model_type: "qwen",
        temperature: 0.1,
      },
    );

    if (!translationResponse.ok) {
      const errorData = await translationResponse.text();
      return NextResponse.json(
        { error: errorData || "Failed to translate transcript" },
        { status: translationResponse.status },
      );
    }

    const translationPayload = await translationResponse.json();
    const translation = extractTextResponse(translationPayload, summary);

    const ttsResponse = await sunbirdPost("/tasks/modal/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: translation,
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
      input_type: "audio",
      target_language: targetLanguage,
      pipeline: {
        transcript,
        summary,
        translation,
        audio: audioPayload,
      },
    });
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process audio",
      },
      { status: 500 },
    );
  }
}
