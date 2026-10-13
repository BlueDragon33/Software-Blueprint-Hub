import { createHash } from "node:crypto";
import { crc32, inflateRawSync } from "node:zlib";

const accepted = new Set(["artifacts/constitution-1.3-candidate.json", "artifacts/constitution-1.3-authority-set.json", "artifacts/constitution-authority-set.json", "artifacts/release-gate-evidence.json"]);
/** Four bounded JSON entries only; never extracts paths or executes archive content. */
export function readConstitutionArtifactZip(input: Uint8Array, digest: string): Record<string, unknown> {
  const bytes = Buffer.from(input);
  if (bytes.length > 80_000_000 || "sha256:" + createHash("sha256").update(bytes).digest("hex") !== digest) throw new TypeError("Artifact ZIP digest/size mismatch");
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0 || bytes.readUInt32LE(end) !== 0x06054b50 || end + 22 > bytes.length || end + 22 + bytes.readUInt16LE(end + 20) !== bytes.length ||
      bytes.readUInt16LE(end + 4) !== 0 || bytes.readUInt16LE(end + 6) !== 0) throw new TypeError("Unsupported artifact ZIP directory");
  const count = bytes.readUInt16LE(end + 10), size = bytes.readUInt32LE(end + 12);
  let position = bytes.readUInt32LE(end + 16);
  if (bytes.readUInt16LE(end + 8) !== count || count < 1 || count > 2048 || position + size !== end) throw new TypeError("Artifact ZIP directory bounds");
  const result: Record<string, unknown> = {};
  for (let i = 0; i < count; i++) {
    if (position + 46 > end || bytes.readUInt32LE(position) !== 0x02014b50) throw new TypeError("Invalid artifact ZIP entry");
    const flags = bytes.readUInt16LE(position + 8), method = bytes.readUInt16LE(position + 10), crc = bytes.readUInt32LE(position + 16);
    const compressed = bytes.readUInt32LE(position + 20), uncompressed = bytes.readUInt32LE(position + 24);
    const nameLength = bytes.readUInt16LE(position + 28), extra = bytes.readUInt16LE(position + 30), comment = bytes.readUInt16LE(position + 32);
    const local = bytes.readUInt32LE(position + 42);
    if (position + 46 + nameLength + extra + comment > end) throw new TypeError("Artifact entry bounds");
    const name = bytes.subarray(position + 46, position + 46 + nameLength).toString("utf8");
    position += 46 + nameLength + extra + comment;
    if (!accepted.has(name)) continue;
    if (name in result || flags & 1 || ![0, 8].includes(method) || uncompressed > 2_000_000 || local + 30 > bytes.length ||
        bytes.readUInt32LE(local) !== 0x04034b50 || bytes.readUInt16LE(local + 8) !== method) throw new TypeError("Unsupported/duplicate artifact proof entry");
    const localName = bytes.readUInt16LE(local + 26), localExtra = bytes.readUInt16LE(local + 28);
    const start = local + 30 + localName + localExtra;
    if (bytes.subarray(local + 30, local + 30 + localName).toString("utf8") !== name || start + compressed > end - size) throw new TypeError("Artifact local entry mismatch");
    const data = bytes.subarray(start, start + compressed);
    const decoded = method === 8 ? inflateRawSync(data, { maxOutputLength: 2_000_000 }) : data;
    if (decoded.length !== uncompressed || crc32(decoded) !== crc) throw new TypeError("Artifact proof CRC/size mismatch");
    result[name] = JSON.parse(decoded.toString("utf8"));
  }
  if (position !== end) throw new TypeError("Artifact directory residue");
  return result;
}
