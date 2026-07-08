# Family Guy Chat

SPA (Single Page Application) que permite conversar con personajes de Family Guy (Peter, Stewie, Brian y Lois Griffin) impulsados por **Google Gemini AI**, construida con HTML, CSS y JavaScript Vanilla (ES Modules), con una Serverless Function en Vercel que protege la API Key.

Proyecto académico sin fines comerciales. Family Guy y sus personajes son propiedad de Fox/20th Television — esta app es una adaptación con fines educativos para reforzar los conocimientos de Frontend, serverless functions, IA, etc.

## Enlaces

- **Repositorio en GitHub:** https://github.com/ciro-castellaro/ProyectoM3_Ciro-Castellaro

- **App deployada:** https://chat-fg.vercel.app

- **Uso de IA:** https://drive.google.com/drive/folders/1_wFPQQfGfvCgE96-Eka9Gfo6I_8VIF3C?usp=sharing

---

## Descripción general

La aplicación permite elegir uno de cuatro personajes de Family Guy y chatear con él en tiempo real. Cada personaje tiene su propia personalidad, forma de hablar y límites de conocimiento, definidos mediante un System Prompt específico que se envía a Gemini en cada conversación.

Es una SPA real: la navegación entre Home, Chat y About se maneja con la History API del navegador (`pushState`/`popstate`), sin recargar la página en ningún momento.

## Características principales

- Selección entre 4 personajes de Family Guy, cada uno con personalidad y System Prompt propios.
- Chat en tiempo real contra Google Gemini, con historial de conversación persistente durante la sesión (por personaje).
- Navegación SPA con History API (sin recargas de página).
- Diseño responsive, Mobile First (Flexbox + Grid).
- Estados visuales: indicador de "escribiendo...", botones deshabilitados mientras se espera respuesta, manejo de errores.
- API Key de Gemini protegida en todo momento: nunca se expone en el frontend, solo la conoce la Serverless Function.
- Suite de tests unitarios con Vitest sobre la lógica pura del proyecto.

## Tecnologías utilizadas

- HTML5
- CSS3 (Flexbox, Grid, Mobile First, Media Queries)
- JavaScript Vanilla (ES Modules)
- Fetch API
- History API
- [Google Gemini API](https://ai.google.dev/) mediante el SDK oficial [`@google/genai`](https://www.npmjs.com/package/@google/genai)
- Vercel Serverless Functions
- [Vitest](https://vitest.dev/) para testing
- Git / GitHub
- Vercel (hosting y deploy)

## Estructura del proyecto

```
project-root/
├── api/
│   └── functions.js          # Serverless Function: proxy hacia Gemini, protege la API Key
├── src/
│   ├── index.html             # Estructura de las 3 vistas (Home, Chat, About)
│   ├── styles.css             # Estilos Mobile First (Flexbox + Grid)
│   ├── app.js                 # Punto de entrada: routing SPA (History API)
│   ├── chat.js                # Estado del chat, integración con la Serverless Function
│   ├── characters.js          # Datos de los personajes: nombre, tagline, avatar y System Prompt
│   └── utils.js               # Funciones puras reutilizables (parseo, validación, fetch, routing)
├── tests/
│   ├── utils.test.js          # Tests de las funciones puras de utils.js
│   └── app.test.js            # Tests de characters.js y de las funciones puras de api/functions.js
├── capturas de pantalla M3/   # Screenshots de la app usadas en este README
├── .env                        # Variables de entorno reales (NUNCA se sube — está en .gitignore)
├── .env.example                # Plantilla de las variables de entorno necesarias
├── .gitignore
├── vercel.json                 # Configuración de Vercel: outputDirectory + rewrite para el routing SPA
├── package.json
└── README.md
```

## Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior
- npm (incluido con Node.js)
- Una cuenta de [Google AI Studio](https://aistudio.google.com/) para generar una API Key de Gemini
- Git
- Cuenta de [Vercel](https://vercel.com/) (para levantar el entorno de desarrollo local con Serverless Functions y para el deploy)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/ciro-castellaro/ProyectoM3_Ciro-Castellaro.git

# Entrar a la carpeta del proyecto
cd ProyectoM3_Ciro-Castellaro

# Instalar dependencias
npm install
```

## Configuración del archivo `.env`

El proyecto necesita una API Key de Google Gemini para funcionar. Nunca se sube al repositorio (está en `.gitignore`) — cada persona que corre el proyecto debe crear su propio `.env` local.

1. Copiá `.env.example` a un nuevo archivo `.env` en la raíz del proyecto:

   ```bash
   cp .env.example .env
   ```

2. Completá el valor real de tu API Key (generada en [Google AI Studio](https://aistudio.google.com/)):

   ```env
   GEMINI_API_KEY=tu_api_key_de_google_gemini_aqui
   ```

## Cómo ejecutar el proyecto localmente

⚠️ **Importante:** este proyecto usa una Serverless Function (`api/functions.js`), así que **no se puede probar con Live Server** ni con ningún servidor de archivos estáticos — esas herramientas no ejecutan funciones serverless y las llamadas a `/api/functions` van a fallar. Hay que levantarlo con la CLI de Vercel:

```bash
npx vercel dev --local --listen 3000
```

- `--local` evita tener que loguearse o vincular el proyecto a una cuenta de Vercel para desarrollo local.
- La app queda disponible en `http://localhost:3000`.

Si ya vinculaste el proyecto a tu cuenta de Vercel (`vercel link`), también podés correr simplemente `vercel dev`.

## Cómo ejecutar los tests

El proyecto usa [Vitest](https://vitest.dev/):

```bash
npm test
```

Esto corre `vitest run` sobre `tests/utils.test.js` y `tests/app.test.js`, cubriendo las funciones puras del proyecto: parseo de texto del encabezado del chat, validación y saneo de mensajes, resolución de rutas, obtención de personajes por id, y el armado del payload que se le envía a Gemini (mapeo de roles y construcción del historial de conversación).

## Deploy en Vercel

1. Subí el repositorio a GitHub (ya hecho en este proyecto).
2. Importá el repositorio en [Vercel](https://vercel.com/new).
3. **Dejá "Root Directory" apuntando a la raíz del repositorio** (no a `src`) — la carpeta `api/` tiene que quedar visible para que Vercel detecte la Serverless Function. La configuración de dónde están los archivos estáticos (`src/`) y el rewrite para el routing SPA ya están resueltos en `vercel.json`, no hace falta tocar nada más ahí.
4. En **Settings → Environment Variables**, agregá `GEMINI_API_KEY` con tu API Key real (marcá al menos el entorno de Production).
5. Deployá. Si agregaste la variable de entorno después de un deploy ya existente, hace falta un **redeploy** para que tome el nuevo valor.

La app deployada de este proyecto está en: **https://chat-fg.vercel.app**

## Serverless Function: por qué protege la API Key

El navegador es un entorno público: cualquier persona puede abrir las DevTools e inspeccionar el código JavaScript que se le envía, incluidas las variables. Si el frontend llamara directamente a la API de Gemini, la API Key tendría que viajar en ese código y cualquier visitante podría copiarla y usarla a costa de la cuenta del dueño del proyecto.

Por eso existe `api/functions.js`: una Serverless Function que corre del lado del servidor de Vercel, no en el navegador del usuario. El flujo es:

```
Navegador (fetch) → /api/functions (Serverless Function, con la key) → Gemini API
Navegador (recibe respuesta) ← /api/functions (reenvía la respuesta) ← Gemini API
```

El frontend nunca conoce la API Key: solo le manda a `/api/functions` el System Prompt del personaje elegido, el historial de la conversación y el último mensaje. Es la función la que lee `GEMINI_API_KEY` desde una variable de entorno del servidor (nunca desde el código) y arma el request real a Gemini usando el SDK oficial [`@google/genai`](https://www.npmjs.com/package/@google/genai). La función también maneja los errores de método inválido, falta de configuración, body incompleto y errores devueltos por Gemini, devolviendo siempre una respuesta JSON consistente al frontend.

## Los personajes y el System Prompt

La app permite elegir entre **4 personajes de Family Guy**, cada uno definido en `src/characters.js` con: `id`, `name`, `tagline` (frase corta para la tarjeta de selección), `avatar` (un emoji, para no depender de imágenes con derechos de autor del show original) y `systemPrompt` (el texto completo de instrucciones para Gemini).

Cada System Prompt sigue la misma estructura:

- **Personalidad:** rasgos de carácter centrales del personaje.
- **Cómo habla:** tono, muletillas y forma de expresarse.
- **Qué sabe:** el conocimiento y contexto narrativo del que sí puede hablar.
- **Qué no sabe:** límites explícitos (tecnología real, política/noticias actuales), y la instrucción de no romper el personaje ni revelar que es un modelo de IA.
- **Límites obligatorios:** guardrails de contenido — nunca violento, sexual, discriminatorio o de odio, sin consejos médicos/legales/financieros reales, humor absurdo pero nunca cruel.

Los cuatro personajes disponibles:

| Personaje             | Descripción                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 🍺 **Peter Griffin**  | Padre de familia impulsivo y distraído, amante de la cerveza Pawtucket y la TV, leal a su familia y amigos, con humor absurdo y tangencial. |
| 👶 **Stewie Griffin** | Bebé genio de vocabulario rebuscado y planes de dominación mundial siempre absurdos e inofensivos, arrogante pero cariñoso en el fondo.     |
| 🐶 **Brian Griffin**  | El perro intelectual de la familia, aspirante a escritor, cínico pero de buen corazón, con tono irónico y referencias culturales.           |
| 👩 **Lois Griffin**   | La madre paciente y sensata de la familia, cálida, directa, con humor seco frente al caos del resto.                                        |

Esta es una versión **adaptada y segura** de los personajes: mantiene el humor característico de cada uno, pero sin el contenido ofensivo o de mal gusto que sí puede tener el show original — una decisión deliberada dado el contexto educativo del proyecto.

## Capturas de pantalla

**Home:**

![Vista principal en desktop](capturas%20de%20pantalla%20M3/principal-pc.png)

**Chat (desktop):**

![Chat en desktop - vista 1](capturas%20de%20pantalla%20M3/chat-pc-1.png)

![Chat en desktop - vista 2](capturas%20de%20pantalla%20M3/chat-pc-2.png)

**About:**

![Vista About](capturas%20de%20pantalla%20M3/about.png)

**Mobile:**

![Vista en teléfono](capturas%20de%20pantalla%20M3/telefono.png)
