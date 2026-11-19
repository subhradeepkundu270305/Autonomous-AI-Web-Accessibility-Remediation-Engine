import http from 'http';
import https from 'https';
import { URL } from 'url';

export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'URL must start with http:// or https://' };
    }
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname.match(/^10\./) || parsed.hostname.match(/^192\.168\./) || parsed.hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
      return { valid: false, error: 'Local or private IP addresses are not allowed' };
    }
    if (url.length > 2048) {
      return { valid: false, error: 'URL is too long (max 2048 characters)' };
    }
    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export async function checkRobotsTxt(targetUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(targetUrl);
    const robotsUrl = `${parsed.protocol}//${parsed.hostname}/robots.txt`;
    
    return new Promise((resolve) => {
      const req = (parsed.protocol === 'https:' ? https : http).get(robotsUrl, { timeout: 5000 }, (res) => {
        if (res.statusCode !== 200) {
          resolve(true); // Default allow on non-200
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const lines = data.split('\n');
          let userAgentMatch = false;
          let allowed = true;
          for (const line of lines) {
            const trimmed = line.trim().toLowerCase();
            if (trimmed.startsWith('user-agent:')) {
              userAgentMatch = trimmed.includes('*');
            } else if (userAgentMatch && trimmed.startsWith('disallow:')) {
              const path = trimmed.split(':')[1].trim();
              if (parsed.pathname.startsWith(path) || path === '/') {
                allowed = false;
              }
            } else if (userAgentMatch && trimmed.startsWith('allow:')) {
              const path = trimmed.split(':')[1].trim();
              if (parsed.pathname.startsWith(path)) {
                allowed = true; // allow overrides disallow if more specific (simplified)
              }
            }
          }
          resolve(allowed);
        });
      });
      req.on('error', () => resolve(true));
      req.on('timeout', () => {
        req.destroy();
        resolve(true);
      });
    });
  } catch (e) {
    return true;
  }
}
