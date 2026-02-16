export default async function handler(req, res) {
  // 1. 設定 CORS (允許跨域存取，防止前端被擋)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // 為了安全，建議上線後將 '*' 改為你的網域
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 處理預檢請求 (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. 檢查請求方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 3. 取得 API Key (從 Vercel 環境變數)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: API Key missing' });
  }

  try {
    // 4. 準備轉發給 Google 的資料
    const GEMINI_MODEL = "gemini-2.0-flash-exp"; 
    const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    // 從前端拿到的資料 (包含歷史紀錄、Prompt 等)
    const requestBody = req.body;

    // 5. 呼叫 Google Gemini API
    const response = await fetch(GOOGLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // 6. 將結果回傳給前端
    if (!response.ok) {
        throw new Error(data.error?.message || 'Gemini API Error');
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: 'Failed to fetch from Gemini' });
  }
}