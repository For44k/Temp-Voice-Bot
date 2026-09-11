import http from "http";
import https from "https";
import dns from "dns/promises";
import net from "net";

export interface SafeFetchOptions {
  maxBytes?: number;
  timeoutMs?: number;
  allowedContentTypes?: string[];
}

export interface SafeFetchResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 0) return true;
    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    if (normalized.startsWith("fe80")) return true;
    return false;
  }

  return true;
}

export async function safeFetchImage(
  urlStr: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const maxBytes = options.maxBytes ?? 10 * 1024 * 1024;
  const timeoutMs = options.timeoutMs ?? 8000;
  const allowedTypes = options.allowedContentTypes ?? [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp"
  ];

  let currentUrl = new URL(urlStr);
  let redirects = 0;
  const maxRedirects = 3;

  while (redirects <= maxRedirects) {
    if (currentUrl.protocol !== "http:" && currentUrl.protocol !== "https:") {
      throw new Error("Invalid URL protocol. Only HTTP and HTTPS are allowed.");
    }

    const hostname = currentUrl.hostname;
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "0.0.0.0"
    ) {
      throw new Error("Access to local addresses is forbidden.");
    }

    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new Error("Could not resolve host address.");
    }

    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new Error("Access to private/internal network addresses is forbidden.");
      }
    }

    const isHttps = currentUrl.protocol === "https:";
    const client = isHttps ? https : http;

    const validatedAddress = addresses[0];

    const result = await new Promise<{
      redirectUrl?: string;
      buffer?: Buffer;
      contentType?: string;
    }>((resolve, reject) => {
      const req = client.get(
        currentUrl,
        {
          timeout: timeoutMs,
          lookup: (_hostname: string, opts: any, cb: any) => {
            if (opts && opts.all) {
              cb(null, [{ address: validatedAddress.address, family: validatedAddress.family }]);
            } else {
              cb(null, validatedAddress.address, validatedAddress.family);
            }
          },
          headers: {
            "User-Agent": "OneTap-Bot/1.0",
            Accept: "image/*"
          }
        },
        (res) => {
          const statusCode = res.statusCode || 500;

          if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
            res.resume();
            try {
              const nextUrl = new URL(res.headers.location, currentUrl);
              resolve({ redirectUrl: nextUrl.toString() });
            } catch (err) {
              reject(new Error("Invalid redirect location."));
            }
            return;
          }

          if (statusCode < 200 || statusCode >= 300) {
            res.resume();
            reject(new Error(`Remote server returned HTTP ${statusCode}.`));
            return;
          }

          const rawContentType = (res.headers["content-type"] || "").toLowerCase().split(";")[0].trim();
          if (rawContentType && !allowedTypes.includes(rawContentType) && !rawContentType.startsWith("image/")) {
            res.resume();
            reject(new Error(`Invalid content type: ${rawContentType}. Only image files are allowed.`));
            return;
          }

          const chunks: Buffer[] = [];
          let totalBytes = 0;

          res.on("data", (chunk: Buffer) => {
            totalBytes += chunk.length;
            if (totalBytes > maxBytes) {
              res.destroy();
              reject(new Error(`Image exceeds maximum allowed size (${Math.round(maxBytes / (1024 * 1024))}MB).`));
              return;
            }
            chunks.push(chunk);
          });

          res.on("end", () => {
            const fullBuffer = Buffer.concat(chunks);
            resolve({
              buffer: fullBuffer,
              contentType: rawContentType || "image/png"
            });
          });

          res.on("error", reject);
        }
      );

      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timed out."));
      });

      req.on("error", reject);
    });

    if (result.redirectUrl) {
      redirects++;
      currentUrl = new URL(result.redirectUrl);
      continue;
    }

    if (result.buffer) {
      const buffer = result.buffer;
      if (buffer.length < 8) {
        throw new Error("Downloaded file is empty or corrupted.");
      }

      let ext = "png";
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        ext = "png";
      } else if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        ext = "jpg";
      } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        ext = "gif";
      } else if (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      ) {
        ext = "webp";
      }

      return {
        buffer,
        contentType: result.contentType || `image/${ext}`,
        extension: ext
      };
    }
  }

  throw new Error("Too many redirects.");
}
