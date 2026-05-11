import { NextRequest, NextResponse } from "next/server";
import {
  extractTextResponse,
  resolveLanguageName,
  sunbirdFormPost,
  sunbirdPost,
} from "../sunbird";

export async function POST(request: NextRequest) {
  try {
    const totalStart = Date.now();
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

    const transcriptionStart = Date.now();
    const transcriptionResponse = await sunbirdPost("/tasks/stt", {
      method: "POST",
      body: transcriptionFormData,
    });

    if (!transcriptionResponse.ok) {
      const errorData = await transcriptionResponse.text();
      const elapsed = Date.now() - transcriptionStart;
      console.log("transcription failed after ms:", elapsed);
      return NextResponse.json(
        { error: errorData || "Failed to transcribe audio", timings: { transcriptionTimeMs: elapsed } },
        { status: transcriptionResponse.status },
      );
    }

    const transcriptionPayload = await transcriptionResponse.json();
    const transcript = extractTextResponse(transcriptionPayload, "");
    const transcriptionTimeMs = Date.now() - transcriptionStart;
    const targetName = resolveLanguageName(targetLanguage);

    const summaryStart = Date.now();
    const summaryResponse = await sunbirdFormPost("/tasks/sunflower_simple", {
      instruction: `Summarize the following text concisely:\n\n${transcript}`,
      model_type: "qwen",
      temperature: "0.3",
    });

    if (!summaryResponse.ok) {
      const errorData = await summaryResponse.text();
      const elapsed = Date.now() - summaryStart;
      console.log("summary failed after ms:", elapsed);
      return NextResponse.json(
        { error: errorData || "Failed to summarize transcript", timings: { summaryTimeMs: elapsed } },
        { status: summaryResponse.status },
      );
    }

    const summaryPayload = await summaryResponse.json();
    const summary = extractTextResponse(summaryPayload, transcript.slice(0, 100));
    const summaryTimeMs = Date.now() - summaryStart;

    const translationStart = Date.now();
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
      const elapsed = Date.now() - translationStart;
      console.log("translation failed after ms:", elapsed);
      return NextResponse.json(
        { error: errorData || "Failed to translate transcript", timings: { translationTimeMs: elapsed } },
        { status: translationResponse.status },
      );
    }

    const translationPayload = await translationResponse.json();
    const translation = extractTextResponse(translationPayload, summary);
    const translationTimeMs = Date.now() - translationStart;

    const ttsStart = Date.now();
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
      const elapsed = Date.now() - ttsStart;
      console.log("tts failed after ms:", elapsed);
      return NextResponse.json(
        { error: errorData || "Failed to generate audio", timings: { ttsTimeMs: elapsed } },
        { status: ttsResponse.status },
      );
    }

    const audioPayload = await ttsResponse.json();
    const ttsTimeMs = Date.now() - ttsStart;
    const totalTimeMs = Date.now() - totalStart;

    const timings = {
      transcriptionTimeMs,
      summaryTimeMs,
      translationTimeMs,
      ttsTimeMs,
      totalTimeMs,
    };

    console.log("pipeline timings ms:", timings);

    return NextResponse.json({
      input_type: "audio",
      target_language: targetLanguage,
      pipeline: {
        transcript,
        summary,
        translation,
        audio: audioPayload,
      },
      timings,
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
