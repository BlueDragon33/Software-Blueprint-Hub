#!/usr/bin/env node
// Read-only feedback intake from Hub Issue #159, the one existing governance ledger.
// This is an event-driven suggestion generator, NOT model training, auto code writing,
// approved review or canonical QualityGate / Production authorization.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { learnFromFeedback, validateStandard } from "./evaluate-quality-evidence.mjs";

export const FEEDBACK_MARKER = "BLUEPRINT_QUALITY_FEEDBACK_V1";
const issueBase = "https://api.github.com/repos/BlueDragon33/Software-Blueprint-Hub/issues/159/comments";
const standardPath = fileURLToPath(new URL("../control/quality-evaluation-standard.v1.json",import.meta.url));

export function extractLedgerEvents(comments) {
  if (!Array.isArray(comments)) throw new Error("INVALID_ISSUE_COMMENTS");
  const events=[];
  // Deliberately parse only explicit JSON blocks; never infer defects from prose
  // or feed arbitrary text to a generative model.
  const pattern=/<!-- BLUEPRINT_QUALITY_FEEDBACK_V1[ \t]*\r?\n([\s\S]{1,5000}?)\r?\n-->/g;
  for (const c of comments) {
    if (!c || typeof c.body !== "string" || c.body.length>300000 ||
      typeof c.id !== "number") throw new Error("INVALID_LEDGER_COMMENT");
    const occurrences=(c.body.match(/<!-- BLUEPRINT_QUALITY_FEEDBACK_V1/g)||[]).length;
    const matches=[...c.body.matchAll(pattern)];
    if (occurrences !== matches.length) throw new Error("MALFORMED_FEEDBACK_MARKER_AT_COMMENT:"+c.id);
    for (const match of matches) {
      let event;
      try {event=JSON.parse(match[1]);} catch {throw new Error("UNPARSEABLE_FEEDBACK_JSON_AT_COMMENT:"+c.id);}
      if (!event || typeof event !== "object" || Array.isArray(event)) throw new Error("INVALID_LEDGER_FEEDBACK_OBJECT");
      events.push({...event, ledgerIssue:159, ledgerCommentId:c.id});
    }
  }
  return {schemaVersion:"1.0.0",events};
}

export async function readCanonicalFeedback(fetchImpl=fetch,token=undefined) {
  if (typeof fetchImpl!=="function") throw new Error("INVALID_FETCH_IMPLEMENTATION");
  const comments=[];
  for (let page=1;page<=10;page++) {
    const url=issueBase+"?per_page=100&page="+page;
    const headers={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};
    if (token) headers.Authorization="Bearer "+token;
    const res=await fetchImpl(url,{method:"GET",headers,redirect:"follow"});
    if (!res || res.ok!==true) throw new Error("LEDGER_FETCH_FAILED_HTTP_"+(res?.status??"UNKNOWN"));
    const body=await res.json();
    if (!Array.isArray(body) || body.length>100) throw new Error("INVALID_ISSUE_API_RESPONSE");
    comments.push(...body);
    if (body.length<100) return extractLedgerEvents(comments);
  }
  throw new Error("LEDGER_PAGINATION_LIMIT_EXCEEDED");
}

export async function summarizeCanonicalFeedback(options={}) {
  const standard=validateStandard(JSON.parse(readFileSync(standardPath,"utf8")));
  const data=await readCanonicalFeedback(options.fetchImpl||fetch,options.token);
  const asOf=options.asOf||new Date().toISOString().slice(0,10);
  const result=learnFromFeedback(standard,data,asOf);
  return {
    ...result,feedbackSource:"BlueDragon33/Software-Blueprint-Hub#159",
    sourceAuthenticatedForReview:false,
    importMode:"READ_ONLY_GITHUB_ISSUE_COMMENTS",
    independentReviewer:"NOT_ATTESTED",
    reviewAndReleaseStatus:"NOT_AUTHORIZED"
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1])) {
  const args=process.argv.slice(2),flag=args.indexOf("--at"),asOf=flag<0?undefined:args[flag+1];
  summarizeCanonicalFeedback({asOf,token:process.env.GITHUB_TOKEN}).then(
    value=>process.stdout.write(JSON.stringify(value,null,2)+"\n"),
    err=>{process.stderr.write("QUALITY_FEEDBACK_BLOCKED: "+err.message+"\n");process.exitCode=2;}
  );
}
