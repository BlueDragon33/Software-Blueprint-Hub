/**
 * Verifies public GitHub Release *compressed* SHA256 and decompressed ELF byte
 * parity against separately inspected exact npm native package. Never exec.
 * Downloading the fixed release asset is done in CI via curl HTTPS only.
 */
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync} from "node:fs";
import {gunzipSync} from "node:zlib";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {verifyElf64Amd64} from "./audit-worker-postinstall-provenance.mjs";

export const fixedRelease=Object.freeze({
 repository:"cloudflare/workerd",
 tag:"v1.20261023.1",
 asset:"workerd-linux-64.gz",
 // GitHub official release asset digest (not npm registry metadata).
 gzipSha256:"28e7942d0ca91c565ee7ef973725b558f96454bbb86ee5bd40802d723aeab909"
});
export function compareWorkerdReleaseBytes(gzipBytes,npmNativeSha256){
 if(!Buffer.isBuffer(gzipBytes)||gzipBytes.length<1024||gzipBytes.length>70*1024*1024)
  throw Error("WORKERD_RELEASE_GZIP_SIZE_INVALID");
 const hash=createHash("sha256").update(gzipBytes).digest("hex");
 if(hash!==fixedRelease.gzipSha256)throw Error("WORKERD_RELEASE_GZIP_DIGEST_MISMATCH");
 const bin=gunzipSync(gzipBytes,{maxOutputLength:230*1024*1024});
 const release=verifyElf64Amd64(bin,"github-release-workerd-linux-64");
 if(!/^[0-9a-f]{64}$/.test(npmNativeSha256??"")||release.sha256!==npmNativeSha256)
  throw Error("WORKERD_NPM_NATIVE_VS_GITHUB_RELEASE_BYTE_MISMATCH");
 return {releaseTag:fixedRelease.tag,releaseAsset:fixedRelease.asset,
  releaseGzipSha256:hash,
  releaseDecompressedElfSha256:release.sha256,
  npmNativeSha256,
  githubReleaseAndNpmNativeBytesEqual:true,
  nativeBinaryExecuted:false,postinstallExecuted:false,
  provenanceIsPublisherSigned:false,sourceReproduciblyBuilt:false,
  runtimeVerified:false,productionAuthorized:false};
}
function main(){
 const path=process.argv[2],nativeReport=process.argv[3],out=process.argv[4];
 if(!path||!nativeReport||!out)throw Error("RELEASE_AUDIT_INPUTS_REQUIRED");
 const data=JSON.parse(readFileSync(nativeReport,"utf8"));
 const native=data.findings?.find(x=>x.spec==="@cloudflare/workerd-linux-64@1.20261023.1");
 if(!native||!native.elf64||native.executed!==false||data.workerdExecuted!==false)
  throw Error("NATIVE_REPORT_NOT_TRUSTED");
 const result=compareWorkerdReleaseBytes(readFileSync(path),native.sha256);
 writeFileSync(out,JSON.stringify(result,null,2)+"\n");
 console.log("[workerd-release] GITHUB_RELEASE_ASSET_SHA256_AND_NPM_ELF_BYTE_MATCH"+
  " sha256="+result.npmNativeSha256+" executed=false signedProvenance=false");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 try{main()}catch(e){console.error("[workerd-release] BLOCKED "+e.message);process.exitCode=1;}
