import { NextRequest, NextResponse } from "next/server";
import {
  extractTextResponse,
  resolveLanguageName,
  sunbirdFormPost,
  sunbirdPost,
} from "../sunbird";

const REQUEST_BUDGET_MS = 270_000;
const TRANSLATION_TIMEOUT_CAP_MS = 180_000;
const TTS_TIMEOUT_CAP_MS = 90_000;

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
    const body = await request.json();
    const { text, target_language } = body;

    if (!text || !target_language) {
      return NextResponse.json(
        { error: "Missing required fields: text, target_language" },
        { status: 400 },
      );
    }

    let summary = text;
    let summaryTimeMs = 0;
    if (text.length > 100) {
      const summaryStart = Date.now();
      const summaryResponse = await sunbirdFormPost("/tasks/sunflower_simple", {
        instruction: `Summarize the following text concisely:\n\n${text}`,
        model_type: "qwen",
        temperature: "0.3",
      });

      if (!summaryResponse.ok) {
        const errorData = await summaryResponse.text();
        const elapsed = Date.now() - summaryStart;
        console.log("summary failed after ms:", elapsed);
        return NextResponse.json(
          {
            error: errorData || "Failed to summarize text",
            timings: { summaryTimeMs: elapsed },
          },
          { status: summaryResponse.status },
        );
      }

      const summaryPayload = await summaryResponse.json();
      summaryTimeMs = Date.now() - summaryStart;
      summary = extractTextResponse(summaryPayload, text.slice(0, 100));
    }

    const targetName = resolveLanguageName(target_language);

    const translationBudgetMs = Math.min(
      TRANSLATION_TIMEOUT_CAP_MS,
      remainingBudgetMs(totalStart),
    );
    if (translationBudgetMs <= 2_000) {
      const totalTimeMs = Date.now() - totalStart;
      return NextResponse.json({
        input: text,
        target_language,
        pipeline: {
          summary,
          translation: summary,
          audio: null,
        },
        warning:
          "Skipped translation/audio because request time budget was exhausted.",
        timings: {
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
          input: text,
          target_language,
          pipeline: {
            summary,
            translation: summary,
            audio: null,
          },
          warning:
            "Translation exceeded time budget. Returned summary without audio.",
          timings: {
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
          error: errorData || "Failed to translate text",
          timings: { translationTimeMs: elapsed },
        },
        { status: translationResponse.status },
      );
    }

    const translationPayload = await translationResponse.json();
    const translationTimeMs = Date.now() - translationStart;
    const translated = extractTextResponse(translationPayload, summary);

    const ttsBudgetMs = Math.min(
      TTS_TIMEOUT_CAP_MS,
      remainingBudgetMs(totalStart),
    );
    if (ttsBudgetMs <= 2_000) {
      const totalTimeMs = Date.now() - totalStart;
      return NextResponse.json({
        input: text,
        target_language,
        pipeline: {
          summary,
          translation: translated,
          audio: null,
        },
        warning:
          "Skipped audio generation because request time budget was low.",
        timings: {
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
          text: translated,
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
          input: text,
          target_language,
          pipeline: {
            summary,
            translation: translated,
            audio: null,
          },
          warning: "Audio generation exceeded time budget.",
          timings: {
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
      const ttsElapsed = Date.now() - ttsStart;
      console.log("tts failed after ms:", ttsElapsed);
      return NextResponse.json(
        {
          error: errorData || "Failed to generate audio",
          timings: { ttsTimeMs: ttsElapsed },
        },
        { status: ttsResponse.status },
      );
    }

    const audioPayload = await ttsResponse.json();
    const ttsTimeMs = Date.now() - ttsStart;
    const totalTimeMs = Date.now() - totalStart;
    const timings = {
      summaryTimeMs: typeof summaryTimeMs === "number" ? summaryTimeMs : 0,
      translationTimeMs,
      ttsTimeMs,
      totalTimeMs,
    };

    console.log("pipeline timings ms:", timings);

    return NextResponse.json({
      input: text,
      target_language,
      pipeline: {
        summary,
        translation: translated,
        audio: audioPayload,
      },
      timings,
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
