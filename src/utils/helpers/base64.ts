/**
 * Convert Uint8Array to base64 string (handles large arrays)
 * Uses manual base64 encoding to avoid btoa() limitations
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i: number;

  for (i = 0; i < bytes.length - 2; i += 3) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1];
    const byte3 = bytes[i + 2];

    result += base64Chars[byte1 >> 2];
    result += base64Chars[((byte1 & 3) << 4) | (byte2 >> 4)];
    result += base64Chars[((byte2 & 15) << 2) | (byte3 >> 6)];
    result += base64Chars[byte3 & 63];
  }

  // Handle remaining bytes (if any)
  if (i < bytes.length) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;

    result += base64Chars[byte1 >> 2];
    result += base64Chars[((byte1 & 3) << 4) | (byte2 >> 4)];

    if (i + 1 < bytes.length) {
      result += base64Chars[(byte2 & 15) << 2];
    } else {
      result += '=';
    }
    result += '=';
  }

  return result;
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}
