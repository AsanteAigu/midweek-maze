// Gemini word validator.
// API key read from .env.local (never committed to git).
// Words are cached so we don't call the API twice for the same word.

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const cache = new Map(); // uppercase word → true/false

export async function checkWords(words) {
  // Returns an object { WORD: true/false } for each word in the list.
  // Hits local cache first; only calls Gemini for words not yet seen.
  const unchecked = [...new Set(words.map(w => w.toUpperCase()))].filter(w => !cache.has(w));

  if (unchecked.length > 0 && API_KEY) {
    const prompt = `You are a strict English dictionary. For each word below decide if it is a standard English word (any tense, plural, form — but NOT a proper noun, abbreviation, or made-up word).
Reply with ONLY a JSON object, no explanation whatsoever.
Words: ${unchecked.map(w => `"${w}"`).join(', ')}
Example reply format: {"CAT": true, "XQZ": false, "CORD": true}`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 300, temperature: 0 },
          }),
        }
      );
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      // Pull out the first {...} from the response (Gemini sometimes adds commentary)
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] ?? '{}';
      const result = JSON.parse(jsonStr);
      for (const [word, valid] of Object.entries(result)) {
        cache.set(word.toUpperCase(), Boolean(valid));
      }
    } catch {
      // Network error or parse failure — treat unchecked words as unknown
    }
  }

  // Build result map
  const out = {};
  for (const w of words) {
    const key = w.toUpperCase();
    out[key] = cache.get(key) ?? false; // unknown → false (conservative)
  }
  return out;
}
