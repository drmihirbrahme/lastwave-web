import { execFile } from 'child_process';
import { promisify } from 'util';
import http from 'http';
import https from 'https';
import { SocksProxyAgent } from 'socks-proxy-agent';

const execFileAsync = promisify(execFile);

interface CachedStream {
  url: string;
  mimeType: string;
  expires: number;
}

const streamCache = new Map<string, CachedStream>();
const TOR_PROXY = 'socks5://127.0.0.1:9050';

export async function isTorRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const agent = new SocksProxyAgent(TOR_PROXY);
    const req = https.get('https://check.torproject.org/api/ip', { agent, timeout: 2000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

export async function getDirectAudioUrl(videoId: string): Promise<{ url: string; mimeType: string }> {
  // Check cache first
  const now = Date.now();
  const cached = streamCache.get(videoId);
  if (cached && cached.expires > now) {
    return { url: cached.url, mimeType: cached.mimeType };
  }

  // Check if Tor is available
  const torActive = await isTorRunning();
  const args = [
    '-g',
    '-f',
    'bestaudio[ext=m4a]/bestaudio',
    `https://www.youtube.com/watch?v=${videoId}`,
    '--no-warnings',
    '--no-check-certificates',
    '--force-ipv4',
  ];

  if (torActive) {
    args.push('--proxy', TOR_PROXY);
  }

  try {
    const { stdout } = await execFileAsync('yt-dlp', args, {
      timeout: 15000,
    });

    const streamUrl = stdout.trim().split('\n')[0];
    if (!streamUrl || !streamUrl.startsWith('http')) {
      throw new Error(`Invalid stream URL resolved for video: ${videoId}`);
    }

    const mimeType = streamUrl.includes('mime=audio%2Fwebm') ? 'audio/webm' : 'audio/mp4';

    // Cache for 4 hours
    streamCache.set(videoId, {
      url: streamUrl,
      mimeType,
      expires: now + 4 * 60 * 60 * 1000,
    });

    return { url: streamUrl, mimeType };
  } catch (err: any) {
    console.error('yt-dlp extraction error for id:', videoId, err.message);
    throw new Error(`Failed to extract audio stream: ${err.message}`);
  }
}

export function createProxiedRequest(
  targetUrl: string,
  rangeHeader: string,
  useTor: boolean
): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  stream: http.IncomingMessage;
}> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(targetUrl);
    const agent = useTor ? new SocksProxyAgent(TOR_PROXY) : undefined;

    const options: https.RequestOptions = {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Range': rangeHeader || 'bytes=0-',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
      },
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      // Handle Google Video 302 Found redirect
      if (res.statusCode === 302 && res.headers.location) {
        return createProxiedRequest(res.headers.location, rangeHeader, useTor)
          .then(resolve)
          .catch(reject);
      }
      resolve({
        statusCode: res.statusCode || 200,
        headers: res.headers,
        stream: res,
      });
    });

    req.on('error', reject);
    req.end();
  });
}
