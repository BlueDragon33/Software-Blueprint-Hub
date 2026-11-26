import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { inspectInstallSource,verifyElf64Amd64 } from "../../scripts/audit-worker-postinstall-provenance.mjs";

const text=`function validateBinaryVersion(){}function installUsingNPM(){}
  child_process.execFileSync("bin",["--version"]);
  child_process.execSync("npm install --prefer-offline test");
  https.get("https://registry.npmjs.org/x");
  fs.writeFileSync("destination","x");
  process.env.ESBUILD_BINARY_PATH;
  const code=301;if(code === 301){return response.headers.location;}
`.repeat(5);
test("Exact two approved-to-inspect names are never execution authority",()=>{
 for(const name of ["esbuild","workerd"]){
  const p=inspectInstallSource(name,text);
  assert.equal(p.executionApproved,false);
  assert.equal(p.inspectedWithoutExecution,true);
  assert.equal(p.compiledUpstreamEquivalenceVerified,false);
  assert.equal(p.sha256,createHash("sha256").update(text).digest("hex"));
  assert.ok(Object.values(p.observedIndicators).every(Boolean));
 }
 assert.throws(()=>inspectInstallSource("evil",text),/SOURCE_NOT_EXACT/);
});
test("Missing install behaviors block provenance even on otherwise valid source",()=>{
 const changed=text.replaceAll("https.get(","notNetwork(").replaceAll("registry.npmjs.org","no-domain");
 assert.throws(()=>inspectInstallSource("workerd",changed),/POSTINSTALL_INDICATOR_DRIFT/);
 assert.throws(()=>inspectInstallSource("esbuild","short"),/SOURCE_NOT_EXACT/);
});
test("Native binary must be Linux 64-bit x86_64 ELF; never execute it",()=>{
 const elf=Buffer.alloc(100);
 elf[0]=127;elf.write("ELF",1,"ascii");elf[4]=2;elf[5]=1;elf.writeUInt16LE(62,18);
 const value=verifyElf64Amd64(elf,"fixture");
 assert.equal(value.elf64,true);assert.equal(value.x86_64,true);
 assert.equal(value.executed,false);
 assert.equal(value.upstreamReleaseByteParityVerified,false);
 assert.equal(value.sha256,createHash("sha256").update(elf).digest("hex"));
 const wrongArch=Buffer.from(elf);wrongArch.writeUInt16LE(183,18);
 assert.throws(()=>verifyElf64Amd64(wrongArch,"fixture"),/NATIVE_BINARY_NOT_LINUX_ELF_X86_64/);
 const wrongMagic=Buffer.from(elf);wrongMagic[0]=0;
 assert.throws(()=>verifyElf64Amd64(wrongMagic,"fixture"),/NATIVE_BINARY_NOT_LINUX_ELF_X86_64/);
});
