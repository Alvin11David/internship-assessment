import { NextRequest, NextResponse } from "next/server";
import {
  extractTextResponse,
  resolveLanguageName,
  sunbirdFormPost,
  sunbirdPost,
} from "../sunbird";

const REQUEST_BUDGET_MS = 270_000;
const TRANSCRIPTION_TIMEOUT_CAP_MS = 90_000;
const SUMMARY_TIMEOUT_CAP_MS = 90_000;
const TRANSLATION_TIMEOUT_CAP_MS = 90_000;
const TTS_TIMEOUT_CAP_MS = 60_000;

function remainingBudgetMs(startedAt: number) {
  return REQUEST_BUDGET_MS - (Date.now() - startedAt);
}

function startStageTimeout(timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

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

    const transcriptionBudgetMs = Math.min(
      TRANSCRIPTION_TIMEOUT_CAP_MS,
      remainingBudgetMs(totalStart),
    );
    if (transcriptionBudgetMs <= 2_000) {
      return NextResponse.json(
        { error: "Request time budget exhausted before transcription." },
        { status: 408 },
      );
    }

    const transcriptionTimeout = startStageTimeout(transcriptionBudgetMs);
    const transcriptionStart = Date.now();
    let transcriptionResponse: Response;
    try {
      transcriptionResponse = await sunbirdPost("/tasks/stt", {
        method: "POST",
        body: transcriptionFormData,
        signal: transcriptionTimeout.signal,
      });
    } catch (error) {
      transcriptionTimeout.clear();
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { error: "Transcription exceeded time budget." },
          { status: 408 },
        );
      }
      throw error;
    } finally {
      transcriptionTimeout.clear();
    }

    if (!transcriptionResponse.ok) {
      const errorData = await transcriptionResponse.text();
      const elapsed = Date.now() - transcriptionStart;
      console.log("transcription failed after ms:", elapsed);
      return NextResponse.json(
        {
          error: errorData || "Failed to transcribe audio",
          timings: { transcriptionTimeMs: elapsed },
        },
        { status: transcriptionResponse.status },
      );
    }

    const transcriptionPayload = await transcriptionResponse.json();
    const transcript = extractTextResponse(transcriptionPayload, "");
    const transcriptionTimeMs = Date.now() - transcriptionStart;
    const targetName = resolveLanguageName(targetLanguage);

    const summaryBudgetMs = Math.min(
      SUMMARY_TIMEOUT_CAP_MS,
      remainingBudgetMs(totalStart),
    );
    if (summaryBudgetMs <= 2_000) {
      return NextResponse.json(
        {
          error: "Request time budget exhausted before summarization.",
          pipeline: {
            transcript,
            summary: transcript,
            translation: transcript,
            audio: null,
          },
        },
        { status: 200 },
      );
    }

    const summaryTimeout = startStageTimeout(summaryBudgetMs);
    const summaryStart = Date.now();
    let summaryResponse: Response;
    try {
      summaryResponse = await sunbirdFormPost(
        "/tasks/sunflower_simple",
        {
          instruction: `Summarize the following text concisely:\n\n${transcript}`,
          model_type: "qwen",
          temperature: "0.3",
        },
        { signal: summaryTimeout.signal },
      );
    } catch (error) {
      summaryTimeout.clear();
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json({
          input_type: "audio",
          target_language: targetLanguage,
          pipeline: {
            transcript,
            summary: transcript,
            translation: transcript,
            audio: null,
          },
          warning: "Summarization exceeded time budget.",
        });
      }
      throw error;
    } finally {
      summaryTimeout.clear();
    }

    if (!summaryResponse.ok) {
      const errorData = await summaryResponse.text();
      const elapsed = Date.now() - summaryStart;
      console.log("summary failed after ms:", elapsed);
      return NextResponse.json(
        {
          error: errorData || "Failed to summarize transcript",
          timings: { summaryTimeMs: elapsed },
        },
        { status: summaryResponse.status },
      );
    }

    const summaryPayload = await summaryResponse.json();
    const summary = extractTextResponse(
      summaryPayload,
      transcript.slice(0, 100),
    );
    const summaryTimeMs = Date.now() - summaryStart;

    const translationBudgetMs = Math.min(
      TRANSLATION_TIMEOUT_CAP_MS,
      remainingBudgetMs(totalStart),
    );
    if (translationBudgetMs <= 2_000) {
      const totalTimeMs = Date.now() - totalStart;
      return NextResponse.json({
        input_type: "audio",
        target_language: targetLanguage,
        pipeline: {
          transcript,
          summary,
          translation: summary,
          audio: null,
        },
        warning:
          "Skipped translation/audio because request time budget was exhausted.",
        timings: {
          transcriptionTimeMs,
          summaryTimeMs,
          translationTimeMs: 0,
          ttsTimeMs: 0,
          totalTimeMs,
        },
      });
    }

    const translationTimeout = startStageTimeout(translationBudgetMs);
    const translationStart = Date.now();
    let translationResponse: Response;
    try {
      translationResponse = await sunbirdFormPost(
        "/tasks/sunflower_simple",
        {
          instruction: `Translate '${summary}' to ${targetName}`,
          model_type: "qwen",
          temperature: "0.1",
        },
        { signal: translationTimeout.signal },
      );
    } catch (error) {
      translationTimeout.clear();
      const translationTimeMs = Date.now() - translationStart;
      const totalTimeMs = Date.now() - totalStart;
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json({
          input_type: "audio",
          target_language: targetLanguage,
          pipeline: {
            transcript,
            summary,
            translation: summary,
            audio: null,
          },
          warning:
            "Translation exceeded time budget. Returned summary without audio.",
          timings: {
            transcriptionTimeMs,
            summaryTimeMs,
            translationTimeMs,
            ttsTimeMs: 0,
            totalTimeMs,
          },
        });
      }
      throw error;
    } finally {
      translationTimeout.clear();
    }

    if (!translationResponse.ok) {
      const errorData = await translationResponse.text();
      const elapsed = Date.now() - translationStart;
      console.log("translation failed after ms:", elapsed);
      return NextResponse.json(
        {
          error: errorData || "Failed to translate transcript",
          timings: { translationTimeMs: elapsed },
        },
        { status: translationResponse.status },
      );
    }

    const translationPayload = await translationResponse.json();
    const translation = extractTextResponse(translationPayload, summary);
    const translationTimeMs = Date.now() - translationStart;

    const ttsBudgetMs = Math.min(
      TTS_TIMEOUT_CAP_MS,
      remainingBudgetMs(totalStart),
    );
    if (ttsBudgetMs <= 2_000) {
      const totalTimeMs = Date.now() - totalStart;
      return NextResponse.json({
        input_type: "audio",
        target_language: targetLanguage,
        pipeline: {
          transcript,
          summary,
          translation,
          audio: null,
        },
        warning:
          "Skipped audio generation because request time budget was low.",
        timings: {
          transcriptionTimeMs,
          summaryTimeMs,
          translationTimeMs,
          ttsTimeMs: 0,
          totalTimeMs,
        },
      });
    }

    const ttsTimeout = startStageTimeout(ttsBudgetMs);
    const ttsStart = Date.now();
    let ttsResponse: Response;
    try {
      ttsResponse = await sunbirdPost("/tasks/modal/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: translation,
          response_mode: "url",
        }),
        signal: ttsTimeout.signal,
      });
    } catch (error) {
      ttsTimeout.clear();
      const ttsTimeMs = Date.now() - ttsStart;
      const totalTimeMs = Date.now() - totalStart;
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json({
          input_type: "audio",
          target_language: targetLanguage,
          pipeline: {
            transcript,
            summary,
            translation,
            audio: null,
          },
          warning: "Audio generation exceeded time budget.",
          timings: {
            transcriptionTimeMs,
            summaryTimeMs,
            translationTimeMs,
            ttsTimeMs,
            totalTimeMs,
          },
        });
      }
      throw error;
    } finally {
      ttsTimeout.clear();
    }

    if (!ttsResponse.ok) {
      const errorData = await ttsResponse.text();
      const elapsed = Date.now() - ttsStart;
      console.log("tts failed after ms:", elapsed);
      return NextResponse.json(
        {
          error: errorData || "Failed to generate audio",
          timings: { ttsTimeMs: elapsed },
        },
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
