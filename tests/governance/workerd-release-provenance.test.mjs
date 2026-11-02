import test from "node:test";
import assert from "node:assert/strict";
import {gzipSync} from "node:zlib";
import {fixedRelease,compareWorkerdReleaseBytes} from "../../scripts/verify-workerd-release-provenance.mjs";
test("Exact github release name, tag and sha256 are pinned without execution",()=>{
 assert.equal(fixedRelease.repository,"cloudflare/workerd");
 assert.equal(fixedRelease.tag,"v1.20261023.1");
 assert.equal(fixedRelease.asset,"workerd-linux-64.gz");
 assert.match(fixedRelease.gzipSha256,/^[a-f0-9]{64}$/);
});
test("Wrong archive digest cannot inherit native binary trust",()=>{
 assert.throws(()=>compareWorkerdReleaseBytes(Buffer.alloc(2000),"a".repeat(64)),/WORKERD_RELEASE_GZIP_DIGEST_MISMATCH/);
 assert.throws(()=>compareWorkerdReleaseBytes(Buffer.from("not gzip"),"a".repeat(64)),/WORKERD_RELEASE_GZIP_SIZE_INVALID/);
 const fabricated=gzipSync(Buffer.alloc(2000));
 assert.throws(()=>compareWorkerdReleaseBytes(fabricated,"a".repeat(64)),/WORKERD_RELEASE_GZIP_DIGEST_MISMATCH/);
});
