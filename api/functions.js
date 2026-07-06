// Serverless Function (Vercel) — actúa como proxy entre el frontend y
// la API de Google Gemini, para que la API Key nunca llegue al navegador.
// El frontend solo habla con esta función (Etapa 8); esta función es la
// única que conoce GEMINI_API_KEY, leída de una variable de entorno del
// servidor, nunca expuesta en el código del cliente.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Gemini espera roles 'user' y 'model' en el historial de conversación;
// nuestro chat local (Etapa 6) guarda los mensajes como 'user'/'character'.
function mapRoleToGemini(role) {
  return role === 'user' ? 'user' : 'model';
}

function buildGeminiRequestBody(systemPrompt, history, message) {
  const contents = [
    ...history.map((entry) => ({
      role: mapRoleToGemini(entry.role),
      parts: [{ text: entry.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  return {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido. Usá POST.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en el servidor.' });
    return;
  }

  const { systemPrompt, history, message } = req.body ?? {};

  if (!systemPrompt || !message) {
    res.status(400).json({ error: 'La solicitud debe incluir systemPrompt y message.' });
    return;
  }

  try {
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildGeminiRequestBody(systemPrompt, history ?? [], message)),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      res.status(geminiResponse.status).json({
        error: data.error?.message || 'Gemini devolvió un error.',
      });
      return;
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      res.status(502).json({ error: 'Gemini no devolvió una respuesta válida.' });
      return;
    }

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error al llamar a la API de Gemini:', error);
    res.status(500).json({ error: 'Error al comunicarse con Gemini.' });
  }
}
