import { expect, test } from "vitest";
import { readConstitutionArtifactZip } from "../../packages/runtime/src/constitution-artifact";
import { createTestArtifact } from "./constitution-artifact-fixture";
import { createHash } from "node:crypto";

test("bounded artifact reader extracts verified JSON bytes and rejects modified archives", () => {
 const archive=createTestArtifact({"artifacts/constitution-1.3-candidate.json":{status:"INACTIVE_CANDIDATE_VERIFIED"}});
 const result=readConstitutionArtifactZip(archive.bytes,archive.digest);
 expect(result["artifacts/constitution-1.3-candidate.json"]).toEqual({status:"INACTIVE_CANDIDATE_VERIFIED"});
 expect(()=>readConstitutionArtifactZip(archive.bytes,"sha256:"+"0".repeat(64))).toThrow();
 const broken=Buffer.from(archive.bytes);broken[0]=0;
 expect(()=>readConstitutionArtifactZip(broken,archive.digest)).toThrow();
});

test.each(["crc", "local-header", "local-name"])("rejects %s corruption even with a matching outer digest", defect => {
 const {bytes}=createTestArtifact({"artifacts/constitution-1.3-candidate.json":{status:"INACTIVE_CANDIDATE_VERIFIED"}});
 const broken=Buffer.from(bytes);
 if(defect==="local-header")broken[0]=0;
 if(defect==="local-name")broken[30]=0;
 if(defect==="crc")broken[30+broken.readUInt16LE(26)+10]^=1;
 const digest="sha256:"+createHash("sha256").update(broken).digest("hex");
 expect(()=>readConstitutionArtifactZip(broken,digest)).toThrow();
});

test("extracts explicit 1.4 proof names without allowing arbitrary names",()=>{const archive=createTestArtifact({"artifacts/constitution-1.4-candidate.json":{version:"1.4.0"},"artifacts/constitution-1.4-authority-set.json":{version:"1.4.0"},"artifacts/constitution-1.5-candidate.json":{version:"1.5.0"}});const result=readConstitutionArtifactZip(archive.bytes,archive.digest);expect(Object.keys(result).sort()).toEqual(["artifacts/constitution-1.4-authority-set.json","artifacts/constitution-1.4-candidate.json"]);});
