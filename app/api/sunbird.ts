const SUNBIRD_BASE_URL = "https://api.sunbird.ai";

const LANGUAGE_NAMES: Record<string, string> = {
  luganda: "Luganda",
  runyankole: "Runyankole",
  ateso: "Ateso",
  lugbara: "Lugbara",
  acholi: "Acholi",
};

export function getSunbirdToken() {
  return (
    process.env.SUNBIRD_API_TOKEN || process.env.NEXT_PUBLIC_SUNBIRD_API_TOKEN
  );
}

export function resolveLanguageName(targetLanguage: string) {
  return LANGUAGE_NAMES[targetLanguage.toLowerCase()] || targetLanguage;
}

export function extractTextResponse(response: unknown, fallback = "") {
  if (!response || typeof response !== "object") {
    return fallback;
  }

  const data = response as Record<string, unknown>;

  const output = data.output;
  if (output && typeof output === "object") {
    const outputData = output as Record<string, unknown>;
    if (typeof outputData.text === "string" && outputData.text) {
      return outputData.text;
    }
  }

  for (const key of ["response", "text", "translation", "summary", "result"]) {
    if (typeof data[key] === "string" && data[key]) {
      return data[key] as string;
    }
  }

  const nestedOutput = data.output;
  if (typeof nestedOutput === "string" && nestedOutput) {
    return nestedOutput;
  }

  const choices = data.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const firstChoice = choices[0];
    if (firstChoice && typeof firstChoice === "object") {
      const choiceData = firstChoice as Record<string, unknown>;
      if (typeof choiceData.text === "string" && choiceData.text) {
        return choiceData.text;
      }
    } else if (typeof firstChoice === "string" && firstChoice) {
      return firstChoice;
    }
  }

  return fallback;
}

export async function sunbirdPost(path: string, init: RequestInit = {}) {
  const token = getSunbirdToken();

  if (!token) {
    throw new Error("SUNBIRD_API_TOKEN environment variable not set");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${SUNBIRD_BASE_URL}${path}`, {
    ...init,
    headers,
  });
}

export async function sunbirdFormPost(
  path: string,
  fields: Record<string, string>,
) {
  const body = new URLSearchParams(fields);

  return sunbirdPost(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
}
