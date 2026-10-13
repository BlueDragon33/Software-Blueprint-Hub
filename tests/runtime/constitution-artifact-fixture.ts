import { createHash } from "node:crypto";
import { crc32 } from "node:zlib";
export function createTestArtifact(entries: Record<string, unknown>) {
 const local: Buffer[] = [], central: Buffer[] = [];let offset = 0;
 for (const [path, value] of Object.entries(entries)) {
  const name=Buffer.from(path), data=Buffer.from(JSON.stringify(value)), checksum=crc32(data);
  const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt32LE(checksum,14);h.writeUInt32LE(data.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(name.length,26);
  const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,6);c.writeUInt32LE(checksum,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);
  local.push(h,name,data);central.push(c,name);offset+=h.length+name.length+data.length;
 }
 const directory=Buffer.concat(central), end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(Object.keys(entries).length,8);end.writeUInt16LE(Object.keys(entries).length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
 const bytes=Buffer.concat([...local,directory,end]);return {bytes,digest:"sha256:"+createHash("sha256").update(bytes).digest("hex")};
}
