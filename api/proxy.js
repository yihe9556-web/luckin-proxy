const LUCKIN_MCP_URL = 'https://gwmcp.lkcoffee.com/order/user/mcp';
const AMAP_BASE_URL = 'https://restapi.amap.com/v3';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amap-Key, X-Amap-Action, X-Amap-Params',
  'Access-Control-Max-Age': '86400',
};

module.exports = async function handler(req, res) {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // ── 高德代理 /api/amap ──
  if (path === '/api/amap') {
    const amapKey = req.headers['x-amap-key'] || '';
    const action = req.headers['x-amap-action'] || '';
    const params = req.headers['x-amap-params'] || '';

    if (!amapKey) {
      return res.status(401).json({ error: 'Missing X-Amap-Key' });
    }
    if (!action) {
      return res.status(400).json({ error: 'Missing X-Amap-Action (e.g. weather/weatherInfo)' });
    }

    try {
      const amapUrl = `${AMAP_BASE_URL}/${action}?key=${amapKey}&${params}&output=JSON`;
      const resp = await fetch(amapUrl);
      const data = await resp.text();
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── 瑞幸代理 /api/proxy ──
  if (path === '/api/proxy') {
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
  }

  return res.status(404).json({ error: 'Not Found' });
};
