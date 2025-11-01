const http = require('http');
const https = require('https');
const url = require('url');

const API_BASE_URL = "https://music-api.gdstudio.xyz/api.php";
const PORT = 3001;

const server = http.createServer((req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url.startsWith('/proxy')) {
        const parsedUrl = url.parse(req.url, true);
        const queryParams = parsedUrl.query;
        
        // 构建API URL
        const apiUrl = new URL(API_BASE_URL);
        Object.keys(queryParams).forEach(key => {
            if (key !== 'target' && key !== 'callback') {
                // 确保参数值被正确编码
                apiUrl.searchParams.set(key, decodeURIComponent(queryParams[key]));
            }
        });

        console.log(`[PROXY] 请求API: ${apiUrl.toString()}`);

        // 发起请求到真实API
        const options = {
            timeout: 10000, // 10秒超时
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Accept-Charset': 'utf-8'
            }
        };

        const request = https.get(apiUrl.toString(), options, (apiRes) => {
            res.writeHead(apiRes.statusCode, {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            });
            apiRes.pipe(res);
        }).on('error', (err) => {
            console.error('[PROXY] API请求错误:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API请求失败' }));
        }).on('timeout', () => {
            console.error('[PROXY] API请求超时');
            res.writeHead(504, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API请求超时' }));
        });

        request.setTimeout(10000);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 代理服务器运行在 http://localhost:${PORT}`);
    console.log(`📡 代理路径: http://localhost:${PORT}/proxy`);
});
