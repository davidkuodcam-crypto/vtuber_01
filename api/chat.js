export default async function handler(req, res) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  // 優化：明確告訴前端 Key 不見了
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is missing in Vercel env vars");
    return res.status(500).json({ error: 'Vercel 環境變數中找不到 GEMINI_API_KEY，請檢查設定並 Redeploy。' });
  }

  try {
    const GEMINI_MODEL = "gemini-2.5-flash"; 
    const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const requestBody = req.body;

    // *** 新增功能：強制啟用 Google Search 工具 ***
    // 確保 requestBody.tools 存在，並加入 google_search
    // 這樣 AI 遇到不知道的問題或需要最新資訊時，就會自動去 Google 搜尋
    if (!requestBody.tools) {
        requestBody.tools = [{ google_search: {} }];
    }

    const response = await fetch(GOOGLE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // 優化：如果 Google 回傳錯誤，將詳細原因轉傳給前端
    if (!response.ok) {
        const googleError = data.error?.message || 'Unknown Gemini API Error';
        console.error("Gemini API Error:", googleError);
        return res.status(500).json({ error: `Google API Error: ${googleError}` });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Server Internal Error:", error);
    return res.status(500).json({ error: `Server Error: ${error.message}` });
  }
}
