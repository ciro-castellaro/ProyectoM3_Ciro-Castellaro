// Serverless Function (Vercel) — actúa como proxy entre el frontend y
// la API de Google Gemini, para que la API Key nunca llegue al navegador.
// El frontend solo habla con esta función (Etapa 8); esta función es la
// única que conoce GEMINI_API_KEY, leída de una variable de entorno del
// servidor, nunca expuesta en el código del cliente.

import { GoogleGenAI } from "@google/genai";

// Modelo hardcodeado (no viene de variable de entorno): si Gemini
// devuelve error de cuota para este modelo, este es el único lugar
// que hay que cambiar para probar con otro.
const GEMINI_MODEL = "gemini-2.5-flash";

// Mismo límite que MAX_MESSAGE_LENGTH en src/utils.js. Se valida de
// nuevo acá porque el cliente podría llamar a esta función
// directamente (saltándose el frontend), así que no alcanza con la
// validación del lado del navegador.
const MAX_MESSAGE_LENGTH = 2000;

// Límite de tokens de la RESPUESTA de Gemini (no del mensaje que
// mandamos nosotros). Sin esto, el modelo puede irse por las ramas y
// devolver respuestas larguísimas, poco naturales para una burbuja
// de chat.
const MAX_OUTPUT_TOKENS = 200;

// Gemini espera roles 'user' y 'model' en el historial de conversación;
// nuestro chat local (Etapa 6) guarda los mensajes como 'user'/'character'.
// Exportadas (no solo el handler) para poder testearlas de forma
// aislada en la Etapa 12, sin necesitar mockear req/res.
export function mapRoleToGemini(role) {
  return role === "user" ? "user" : "model";
}

export function buildContents(history, message) {
  return [
    ...history.map((entry) => ({
      role: mapRoleToGemini(entry.role),
      parts: [{ text: entry.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido. Usá POST." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res
      .status(500)
      .json({ error: "Falta configurar GEMINI_API_KEY en el servidor." });
    return;
  }

  const { systemPrompt, history, message } = req.body ?? {};

  if (!systemPrompt || !message) {
    res
      .status(400)
      .json({ error: "La solicitud debe incluir systemPrompt y message." });
    return;
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({
      error: `El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres.`,
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildContents(history ?? [], message),
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        // Gemini 2.5 "piensa" internamente antes de responder, y esos
        // tokens de pensamiento cuentan contra maxOutputTokens. Sin
        // desactivarlo, la respuesta visible puede quedar cortada a
        // mitad de frase. thinkingBudget: 0 lo desactiva por completo.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const reply = response.text;

    if (!reply) {
      res
        .status(502)
        .json({ error: "Gemini no devolvió una respuesta válida." });
      return;
    }

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Error al llamar a la API de Gemini:", error);
    res.status(500).json({ error: "Error al comunicarse con Gemini." });
  }
}
