/**
 * @she-raksha/crypto-core — Base91 GSM-7 Codec
 *
 * Implements high-density Base91 encoding/decoding designed for SMS transmission.
 * Base91 encodes 13 or 14 bits into two characters from a 91-character alphabet,
 * achieving ~1.229 expansion ratio (compared to 1.333 for Base64).
 *
 * All 91 characters are selected from the GSM-7 / standard printable ASCII set
 * to ensure 100% single-segment delivery (< 160 characters for < 140 bytes raw payload).
 */

// 91 characters chosen from printable ASCII (excluding backslash and double quote to prevent SMS gateway escaping)
export const BASE91_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~' as const;

if (BASE91_ALPHABET.length !== 91) {
  throw new Error(`Base91 alphabet must contain exactly 91 characters, got ${BASE91_ALPHABET.length}`);
}

const DECODE_TABLE = new Int16Array(256).fill(-1);
for (let i = 0; i < BASE91_ALPHABET.length; i++) {
  DECODE_TABLE[BASE91_ALPHABET.charCodeAt(i)] = i;
}

/**
 * Encodes a binary buffer into a Base91 string.
 */
export function base91Encode(data: Buffer | Uint8Array): string {
  let queue = 0;
  let numBits = 0;
  let output = '';

  for (let i = 0; i < data.length; i++) {
    queue |= (data[i] & 255) << numBits;
    numBits += 8;

    if (numBits > 13) {
      let value = queue & 8191;

      if (value > 88) {
        queue >>= 13;
        numBits -= 13;
      } else {
        value = queue & 16383;
        queue >>= 14;
        numBits -= 14;
      }

      output += BASE91_ALPHABET[value % 91];
      output += BASE91_ALPHABET[Math.floor(value / 91)];
    }
  }

  if (numBits > 0) {
    output += BASE91_ALPHABET[queue % 91];
    if (numBits > 7 || queue > 90) {
      output += BASE91_ALPHABET[Math.floor(queue / 91)];
    }
  }

  return output;
}

/**
 * Decodes a Base91 string into a Buffer.
 */
export function base91Decode(text: string): Buffer {
  let queue = 0;
  let numBits = 0;
  let value = -1;
  const output: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const d = charCode < 256 ? DECODE_TABLE[charCode] : -1;

    if (d === -1) {
      continue; // Skip whitespace or unknown characters
    }

    if (value === -1) {
      value = d;
    } else {
      value += d * 91;
      queue |= value << numBits;
      numBits += (value & 8191) > 88 ? 13 : 14;

      do {
        output.push(queue & 255);
        queue >>= 8;
        numBits -= 8;
      } while (numBits > 7);

      value = -1;
    }
  }

  if (value !== -1) {
    output.push((queue | (value << numBits)) & 255);
  }

  return Buffer.from(output);
}
