const LUCKIN_MCP_URL = 'https://gwmcp.lkcoffee.com/order/user/mcp';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

module.exports = async function handler(req, res) {
  // 设置 CORS 头
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization' });
  }

  try {
    const body = JSON.stringify(req.body);
    const resp = await fetch(LUCKIN_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
        'User-Agent': 'Mozilla/5.0',
      },
      body: body,
    });

    const data = await resp.text();
    res.setHeader('Content-Type', resp.headers.get('content-type') || 'application/json');
    return res.status(resp.status).send(data);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
