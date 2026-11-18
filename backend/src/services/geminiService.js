const { GoogleGenAI } = require('@google/genai');

/**
 * 10 Fallback edge-case test cases covering:
 * - Empty fields
 * - Very long text
 * - Wrong types
 * - Negative numbers
 * - Special characters and script injections
 *
 * Used when GEMINI_API_KEY is not set or Gemini returns invalid JSON.
 */
function getFallbackTestCases(method = 'POST') {
  if (method === 'GET') {
    return [
      { name: 'Base request (empty query)', data: {} },
      { name: 'Negative numbers in parameters', data: { page: -1, limit: -50 } },
      { name: 'Very long text string', data: { search: 'A'.repeat(500) } },
      { name: 'Special symbols and unicode', data: { query: '!@#$%^&*()_+{}[]:;<>?,./', emoji: '🚀🔥' } },
      { name: 'Wrong types (string for numeric)', data: { id: 'not-a-valid-id', count: 'invalid' } },
      { name: 'HTML / Script injection attempt', data: { q: '<script>alert("xss")</script>' } },
      { name: 'SQL Injection pattern', data: { filter: "' OR '1'='1" } },
      { name: 'Whitespace only parameter', data: { search: '     ' } },
      { name: 'Extreme numeric values (overflow)', data: { id: 999999999999999 } },
      { name: 'Null and empty parameter values', data: { category: '', active: null } },
    ];
  }

  // Fallback edge cases for POST / PUT
  return [
    { name: 'Empty payload object', data: {} },
    { name: 'Very long text string (buffer/length test)', data: { title: 'A'.repeat(500), body: 'B'.repeat(1000) } },
    { name: 'Negative numbers and zero', data: { userId: -1, amount: -9999, quantity: 0 } },
    { name: 'Special characters and emojis', data: { title: '!@#$%^&*()_+{}[]:;"\'<>?,./', tag: '✨🧪🔥' } },
    { name: 'Wrong types (string instead of number)', data: { userId: 'not-a-number', count: 'twenty' } },
    { name: 'Wrong types (number instead of string)', data: { title: 123456789, name: 99.99 } },
    { name: 'HTML and JavaScript injection payload', data: { title: '<script>alert("xss")</script>', body: '<img src=x onerror=alert(1)>' } },
    { name: 'SQL Injection characters', data: { query: "'; DROP TABLE users; --", name: "admin'--" } },
    { name: 'Extreme numeric boundary values', data: { amount: 999999999999999, id: 2147483648 } },
    { name: 'Unexpected null and boolean fields', data: { title: null, active: true, extra: false } },
  ];
}

/**
 * Calls Google Gemini API to generate 10 realistic edge-case test cases.
 * Wrapped in a try/catch block with fallback handling.
 *
 * @param {string} url - Target API URL
 * @param {string} method - 'GET' or 'POST'
 * @param {object|string} sampleBody - Optional sample body or schema
 * @returns {Promise<Array>} Array of 10 test case objects: [{ name, data }]
 */
async function generateTestCases(url, method = 'POST', sampleBody = null) {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no API key is provided, gracefully use the 10 fallback test cases
  if (!apiKey || apiKey.trim() === '') {
    console.log('[GeminiService] GEMINI_API_KEY is not configured in .env. Using fallback edge cases.');
    return getFallbackTestCases(method);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert software QA engineer testing API endpoints for edge cases and vulnerabilities.
Generate exactly 10 edge-case test inputs for testing the following API endpoint:
- Target URL: ${url}
- HTTP Method: ${method}
- Optional Description / Sample Body: ${sampleBody ? JSON.stringify(sampleBody) : 'None provided'}

Include these 10 specific edge-case scenarios:
1. Empty payload or empty fields
2. Very long text strings (testing field length limits)
3. Wrong data types (e.g., string where number expected, boolean where string expected)
4. Negative numbers and zero boundaries
5. Special characters, punctuation, and unicode symbols
6. HTML/script injection patterns (e.g., <script>alert(1)</script>)
7. Whitespace-only strings
8. Extreme numeric boundaries or large integers
9. Null or missing required values
10. Unexpected keys or unusual structure

Return ONLY a valid JSON array of exactly 10 objects.
Each object must have this exact format:
{
  "name": "Short descriptive name of the edge case",
  "data": { ...the input payload or query parameters to test... }
}
Do NOT include markdown fences, code blocks (\`\`\`json), or any conversational text. Return only raw JSON.
`;

    console.log(`[GeminiService] Requesting 10 edge cases from Gemini for ${method} ${url}...`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawContent = response.text;
    if (!rawContent) {
      throw new Error('Gemini returned an empty response.');
    }

    // Clean up response if any stray markdown backticks remain
    const sanitizedText = rawContent
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Parse the JSON array
    const parsed = JSON.parse(sanitizedText);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Gemini response is not a JSON array.');
    }

    // Normalize each test case object and ensure maximum 10 items
    const normalizedCases = parsed.slice(0, 10).map((item, index) => ({
      name: item.name || `Gemini Edge Case #${index + 1}`,
      data: item.data !== undefined ? item.data : (typeof item === 'object' ? item : {}),
    }));

    console.log(`[GeminiService] Successfully generated ${normalizedCases.length} edge cases from Gemini.`);
    return normalizedCases;
  } catch (error) {
    // Safety requirement: Handle invalid JSON or API failures with fallback test cases
    console.warn(`[GeminiService] Gemini API call or JSON parsing failed (${error.message}). Falling back to hardcoded edge cases.`);
    return getFallbackTestCases(method);
  }
}

module.exports = {
  generateTestCases,
  getFallbackTestCases,
};
