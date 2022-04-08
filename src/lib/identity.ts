export function newUuid(): string {
  // If it's a very recent browser (at time of writing), woo!
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  // Otherwise, we'll follow the algorithm described here:
  // https://w3c.github.io/webcrypto/#Crypto-method-randomUUID

  // Step 1:
  // Use a byte array `bytes`, 16 bytes long, which will be filled with random
  // numbers from 0-255 (1 byte/8 bits each).
  const bytes = new Uint8Array(16);

  // Step 2:
  // Fill `bytes` with cryptographically secure random bytes. Each will be
  // represented in hexadecimal to comprise two consecutive digits of the 32
  // available digits in the UUID string. The UUID is actually 36 characters
  // long, but 4 of those characters are hyphens.
  crypto.getRandomValues(bytes);

  // The UUID will look like this, where Y represents the UUID version number
  // and Z represents the UUID variant.
  // ########-####-Y###-Z###-############

  // Step 3:
  // Set the four most significant bits of `bytes[6]`, which represent the UUID
  // version, to `0100` (which in hex/decimal is 4, for UUID version 4, so the
  // first digit of this two-digit/one-byte hex number shows up as "4").
  bytes[6] = (bytes[6] & 0b00001111) | 0b01000000;
  // ########-####-4###-Z###-############
  
  // Step 4:
  // Set the two most significant bits of `bytes[8]`, which represent the
  // UUID variant, to `10` (harder to explain... bytes 00-ff in hex will cycle
  // from 80-bf four times; like, the first digit of this two-digit/one-byte hex
  // number will be `((itself % 4) + 8)`).
  bytes[8] = (bytes[8] & 0b00111111) | 0b10000000;
  // ########-####-4###-8###-############
  // ########-####-4###-9###-############
  // ########-####-4###-a###-############
  // ########-####-4###-b###-############

  // Step 5:
  // Concatenate the hexadecimal representations of each byte, separated by
  // hyphens in appropriate positions, into one long UUIDv4 string.
  return ""
    + bytes[0].toString(16)
    + bytes[1].toString(16)
    + bytes[2].toString(16)
    + bytes[3].toString(16)
    + "-"
    + bytes[4].toString(16)
    + bytes[5].toString(16)
    + "-"
    + bytes[6].toString(16)
    + bytes[7].toString(16)
    + "-"
    + bytes[8].toString(16)
    + bytes[9].toString(16)
    + "-"
    + bytes[10].toString(16)
    + bytes[11].toString(16)
    + bytes[12].toString(16)
    + bytes[13].toString(16)
    + bytes[14].toString(16)
    + bytes[15].toString(16);
}

export function setBrowserUuid(uuid: string): void {
  localStorage.setItem("spillink:v1:browserUuid", uuid);
}

let _browserUuid = "";
export function browserUuid(): string {
  const existing = _browserUuid || localStorage.getItem("spillink:v1:browserUuid");
  if (existing) return existing;

  _browserUuid = newUuid();
  setBrowserUuid(_browserUuid);
  return _browserUuid;
}
