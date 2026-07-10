/**
 * 瑞幸咖啡 MCP 代理 Worker
 * 解决浏览器直接调用 gwmcp.lkcoffee.com 的跨域问题
 * 部署到 Cloudflare Workers 后，把 codxsj-chat-worldbook.js 里的
 * _LKURL 改成你的 Worker 地址即可
 */

const LUCKIN_MCP_URL = 'https://gwmcp.lkcoffee.com/order/user/mcp';

// 允许跨域的来源（填你的域名，* 表示全部允许）
const ALLOWED_ORIGIN = '*';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    try {
      // 取出前端传来的 Authorization header（Bearer token）
      const auth = request.headers.get('Authorization') || '';
      if (!auth.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing Authorization' }), {
          status: 401,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }

      // 读取请求体
      const body = await request.text();

      // 转发到瑞幸 MCP
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

      return new Response(data, {
        status: resp.status,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': resp.headers.get('Content-Type') || 'application/json',
        }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }
};
