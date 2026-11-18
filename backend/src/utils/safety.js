const dns = require('dns').promises;

/**
 * Checks if an IP address belongs to a private/internal network.
 * This prevents SSRF (Server-Side Request Forgery) attacks where a user
 * could try to access internal network routers, metadata services, or databases.
 *
 * Blocked ranges:
 * - 127.0.0.0/8 (Loopback / Localhost)
 * - 10.0.0.0/8 (Private IP range)
 * - 172.16.0.0/12 (Private IP range: 172.16.0.0 to 172.31.255.255)
 * - 192.168.0.0/16 (Private IP range)
 * - 169.254.0.0/16 (Link-local IP range)
 * - 0.0.0.0
 * - IPv6 loopback (::1) and private ranges
 */
function isPrivateIp(ip) {
  // Check IPv6 loopback and link-local/unique-local
  if (ip === '::1' || ip === '::' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) {
    return true;
  }

  // Parse IPv4 segments (e.g. "192.168.1.1" -> [192, 168, 1, 1])
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return false;
  }

  const [first, second] = parts;

  // 127.x.x.x -> Loopback
  if (first === 127) return true;

  // 10.x.x.x -> Private Class A
  if (first === 10) return true;

  // 172.16.x.x - 172.31.x.x -> Private Class B
  if (first === 172 && second >= 16 && second <= 31) return true;

  // 192.168.x.x -> Private Class C
  if (first === 192 && second === 168) return true;

  // 169.254.x.x -> Link-local (cloud metadata services like AWS 169.254.169.254)
  if (first === 169 && second === 254) return true;

  // 0.0.0.0 -> Broadcast / local network
  if (first === 0) return true;

  return false;
}

/**
 * Validates the target URL:
 * 1. Checks that the URL string is well-formed.
 * 2. Ensures the protocol is strictly 'http:' or 'https:'.
 * 3. Rejects 'localhost' and known local hostnames.
 * 4. Resolves domain names via DNS to prevent DNS-rebinding to private IPs.
 */
async function validateUrl(targetUrl) {
  let parsedUrl;

  try {
    parsedUrl = new URL(targetUrl);
  } catch (err) {
    throw new Error('Invalid URL format. Please provide a full URL starting with http:// or https://');
  }

  // Rule 1: Only HTTP and HTTPS allowed
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS protocols are allowed.');
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // Rule 2: Explicitly block localhost and local domain names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0'
  ) {
    throw new Error('Requests to localhost and internal services are blocked for safety.');
  }

  // Rule 3: Check if the hostname itself is directly a private IP address
  if (isPrivateIp(hostname)) {
    throw new Error('Requests to private IP addresses are blocked for safety.');
  }

  // Rule 4: Resolve DNS to ensure the domain name doesn't resolve to a private IP
  try {
    const lookup = await dns.lookup(hostname);
    if (isPrivateIp(lookup.address)) {
      throw new Error(`Hostname resolves to private IP (${lookup.address}), which is blocked for safety.`);
    }
  } catch (err) {
    // If our own safety error was thrown, re-throw it
    if (err.message && err.message.includes('blocked for safety')) {
      throw err;
    }
    // If DNS lookup failed completely (e.g. non-existent domain)
    throw new Error(`Could not resolve hostname "${hostname}". Please check if the URL is valid and reachable.`);
  }

  return parsedUrl.toString();
}

module.exports = {
  isPrivateIp,
  validateUrl,
};
