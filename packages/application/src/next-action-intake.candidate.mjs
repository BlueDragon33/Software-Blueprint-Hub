/** Read-only deterministic task intake. Canonical persistence and PROJECT_MUTATE
 * authorization belong to the already existing WorkQualityApplicationService.
 * This projection never executes an agent, grants rights or marks a Gate PASS.
 */
import {createHash} from 'node:crypto';
export const NEXT_ACTION_INTAKE_VERSION = 'ana-intake:0.1.0';
const PROJECT=/^project:[a-z0-9][a-z0-9-]{0,158}$/;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
function reject(reason){throw new TypeError('ANA_INTAKE_BLOCKED: '+reason)}

/** Caller supplies *authenticated* project and current canonical revision.
 * `existingWorkPackages` must be read from the same authorized project. */
export function prepareNextActionIntake(input, context){
 if(!input||typeof input!=='object'||Array.isArray(input)||!context||typeof context!=='object')reject('missing input/context');
 const {projectId,requestId,sourceRevision,kind,content,selectedWorkPackageId=null}=input;
 const {authorizedProjectId,currentSourceRevision,existingWorkPackages,now}=context;
 if(!PROJECT.test(projectId??'')||projectId!==authorizedProjectId)reject('project scope');
 if(typeof sourceRevision!=='string'||!sourceRevision||sourceRevision.length>256)reject('missing source revision');
 if(!UUID.test(requestId??''))reject('request id');
 if(kind!=='addition'&&kind!=='other')reject('task kind');
 if(typeof content!=='string'||content.length>2000)reject('content length');
 if(!Array.isArray(existingWorkPackages)||existingWorkPackages.length>5000||existingWorkPackages.some(w=>!w||w.projectId!==projectId))reject('work list scope');
 if(selectedWorkPackageId!==null && (typeof selectedWorkPackageId!=='string'||selectedWorkPackageId.length>160))reject('selected work id');
 const trimmed=content.trim();
 if(!trimmed)return Object.freeze({kind:'navigate',projectId,sourceRevision,mayDispatch:false});
 let dependencies=[];
 if(kind==='addition'&&selectedWorkPackageId){
  if(!existingWorkPackages.some(w=>w.id===selectedWorkPackageId))reject('unknown selected work');
  dependencies=[selectedWorkPackageId];
 }
 const fingerprint=createHash('sha256').update(projectId+'\0'+requestId).digest('hex').slice(0,24);
 const id='work:next-'+fingerprint;
 if(dependencies.includes(id))reject('self dependency');
 const duplicate=existingWorkPackages.find(w=>w.id===id);
 if(duplicate){
  if(duplicate.purpose!==trimmed||JSON.stringify(duplicate.dependencies)!==JSON.stringify(dependencies))reject('request id conflict');
  return Object.freeze({kind:'already-saved',projectId,workPackageId:id,sourceRevision,mayDispatch:false});
 }
 if(sourceRevision!==currentSourceRevision)reject('stale source revision');
 if(typeof now!=='string'||!Number.isFinite(Date.parse(now)))reject('server time');
 const heading=trimmed.split(/\r?\n/)[0].trim() || 'New task';
 const workPackage=Object.freeze({
  id,projectId,title:('[Next Action] '+heading).slice(0,200),purpose:trimmed,
  dependencies:Object.freeze(dependencies),
  acceptanceCriteria:Object.freeze(['Authorized owner must review the new scope, required QA evidence and gates before changing this task to READY.']),
  qualityGateIds:Object.freeze([]),status:'planned',
  meta:Object.freeze({schemaVersion:'1.0.0',recordVersion:1,createdAt:now,updatedAt:now})
 });
 return Object.freeze({kind:'create-planned',projectId,workPackageId:id,sourceRevision,mayDispatch:false,workPackage});
}
