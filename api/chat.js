export default async function handler(req, res) {
  // ==========================================
  // 1. CORS 安全防護設定 (白名單機制)
  // ==========================================
  // 這裡設定「只允許」哪些網址可以呼叫這支 API。
  const allowedOrigins = [
    'https://vtuber01.vercel.app',           // 您的 Vercel 正式網址 (主要)
    'https://davidkuodcam-crypto.github.io', // 您的 GitHub Pages (備用/舊版)
    'http://localhost:3000',                 // 本機測試用
    'http://127.0.0.1:5500'                  // VS Code Live Server 測試用
  ];

  const requestOrigin = req.headers.origin;

  // 檢查發出請求的網頁，是否有在我們的白名單內
  if (allowedOrigins.includes(requestOrigin)) {
    // 如果有，就允許通過
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else {
    // 如果沒有在白名單內，就不設定 Allow-Origin，瀏覽器會自動擋下該請求
  }

  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // 只開放 POST 和 OPTIONS
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 處理瀏覽器的 OPTIONS 預檢請求 (Pre-flight request)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ==========================================
  // 2. 阻擋非 POST 請求
  // ==========================================
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ==========================================
  // 3. 讀取 API KEY 與呼叫 Gemini
  // ==========================================
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is missing in Vercel env vars");
    return res.status(500).json({ error: 'Vercel 環境變數中找不到 GEMINI_API_KEY，請檢查設定並 Redeploy。' });
  }

  try {
    const GEMINI_MODEL = "gemini-2.5-flash"; 
    const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const requestBody = req.body;

    // 強制啟用 Google Search 工具，讓 AI 能查最新資料
    if (!requestBody.tools) {
        requestBody.tools = [{ google_search: {} }];
    }

    const response = await fetch(GOOGLE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // 如果 Google 回傳錯誤，將詳細原因轉傳給前端
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
