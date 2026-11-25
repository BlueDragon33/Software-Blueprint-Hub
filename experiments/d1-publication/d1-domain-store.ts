// Narrow internal SQL port for the five document repository families.
// All identifiers are pinned here; all external values are bound.
export type SqlValue = string | number | null;
export interface D1Result { success: boolean; results?: unknown[]; meta?: {changes?: number} }
export interface D1Statement { bind(...values: SqlValue[]): D1Statement; all(): Promise<D1Result> }
export interface D1Binding { prepare(sql: string): D1Statement; batch(statements: D1Statement[]): Promise<D1Result[]> }
const columns = {
  Project: ['id'],
  ProjectProfile: ['id','projectId','schemaVersion','recordVersion','document','createdAt','updatedAt'],
  WorkPackage: ['id','projectId','schemaVersion','recordVersion','status','document','createdAt','updatedAt'],
  QualityGate: ['id','projectId','schemaVersion','recordVersion','status','document','createdAt','updatedAt'],
  GateEvidence: ['id','gateId','kind','source','revision','document','createdAt'],
  ArchitectureDecision: ['id','projectId','schemaVersion','recordVersion','status','document','createdAt','updatedAt'],
  Risk: ['id','projectId','schemaVersion','recordVersion','likelihood','impact','status','document','createdAt','updatedAt'],
  TechnicalDebt: ['id','projectId','schemaVersion','recordVersion','severity','status','document','createdAt','updatedAt'],
  ReleaseRecord: ['id','projectId','schemaVersion','recordVersion','version','revision','environment','status','document','createdAt','updatedAt'],
  LessonLearned: ['id','projectId','releaseId','schemaVersion','recordVersion','category','document','createdAt','updatedAt'],
  PromptProjectionSnapshot: ['snapshotKey','projectId','projectionId','sourceRevision','templateVersion','contentHash','generatedAt','document','createdAt']
} as const;
export type Table = keyof typeof columns;
type Data = Record<string, unknown>;
type Order = Record<string, 'asc' | 'desc'>;
export interface DocumentRow {id: string | undefined; projectId: string | undefined; schemaVersion: string | undefined; recordVersion: number | undefined; document: unknown; evidence: DocumentRow[]}
interface ReadOptions {where?: Data; orderBy?: Order | Order[]; take?: number; skip?: number; include?: {evidence: {orderBy: Order[]}}}
const quote=(id:string)=>'"'+id+'"';
function tableName(table:Table){if(!Object.hasOwn(columns,table))throw new TypeError('Unsupported table');return quote(table)}
function col(table:Table,key:string){if(!(columns[table] as readonly string[]).includes(key))throw new TypeError('Unsupported column');return quote(key)}
function value(key:string,v:unknown):SqlValue {if(key==='document'){const text=JSON.stringify(v);if(typeof text!=='string')throw new TypeError('Invalid JSON');return text;}if(v instanceof Date)return v.toISOString();if(v===null||typeof v==='string'||(typeof v==='number'&&Number.isSafeInteger(v)))return v;throw new TypeError('Unsupported bound value')}
function where(table:Table,filter:Data={}) {const vals:SqlValue[]=[];const parts=Object.entries(filter).map(([k,v])=>{const c=col(table,k);if(v&&typeof v==='object'&&'in' in v){if(!Array.isArray(v.in)||v.in.some(x=>typeof x!=='string'))throw new TypeError('Invalid membership');vals.push(JSON.stringify(v.in));return `${c} IN (SELECT value FROM json_each(?))`;}if(v===null)return `${c} IS NULL`;vals.push(value(k,v));return `${c}=?`;});return {sql:parts.length?' WHERE '+parts.join(' AND '):'',vals};}
function rows(result:D1Result):Data[]{if(result.success!==true||!Array.isArray(result.results))throw Error('D1 read unavailable');return result.results.map(x=>{if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Invalid row');return x as Data;});}
function decode(row:Data):DocumentRow {if(typeof row.document!=='string')throw Error('Invalid document column');return {id:typeof row.id==='string'?row.id:undefined,projectId:typeof row.projectId==='string'?row.projectId:undefined,schemaVersion:typeof row.schemaVersion==='string'?row.schemaVersion:undefined,recordVersion:typeof row.recordVersion==='number'?row.recordVersion:undefined,document:JSON.parse(row.document),evidence:[]};}
function ensure(result:D1Result[],n:number){if(!Array.isArray(result)||result.length!==n||result.some(x=>x.success!==true))throw Error('D1 write result unavailable; reconcile before retry');}
export class D1DomainStore {
  constructor(private readonly db:D1Binding){}
  private stmt(sql:string,vals:SqlValue[]=[]){return this.db.prepare(sql).bind(...vals)}
  private insert(table:Table,data:Data){const d={...data};if((columns[table] as readonly string[]).includes('updatedAt'))d.updatedAt=new Date().toISOString();const keys=Object.keys(d);return this.stmt(`INSERT INTO ${tableName(table)} (${keys.map(k=>col(table,k)).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`,keys.map(k=>value(k,d[k])))}
  async create(table:Table,input:{data:Data}){ensure(await this.db.batch([this.insert(table,input.data)]),1)}
  async createProjectWithProfile(projectId:string,data:Data){if(data.projectId!==projectId)throw new TypeError('Profile identity mismatch');ensure(await this.db.batch([this.insert('Project',{id:projectId}),this.insert('ProjectProfile',data)]),2)}
  private select(table:Table,o:ReadOptions={}){const w=where(table,o.where);const order=(Array.isArray(o.orderBy)?o.orderBy:[o.orderBy??{}]).flatMap(x=>Object.entries(x)).map(([k,v])=>{if(v!=='asc'&&v!=='desc')throw new TypeError('Invalid order');return `${col(table,k)} ${v.toUpperCase()}`;});for(const n of [o.take,o.skip])if(n!==undefined&&(!Number.isSafeInteger(n)||n<0))throw new TypeError('Invalid page');const limit=o.take!==undefined||o.skip!==undefined?' LIMIT ? OFFSET ?':'';return this.stmt(`SELECT * FROM ${tableName(table)}${w.sql}${order.length?' ORDER BY '+order.join(','):''}${limit}`,[...w.vals,...(limit?[o.take??-1,o.skip??0]:[])]);}
  async findUnique(table:Table,o:ReadOptions){if(!o.where||!Object.keys(o.where).length)throw new TypeError('Unique filter required');const r=rows(await this.select(table,{...o,take:2}).all());if(r.length>1)throw Error('Nonunique result');return r[0]?decode(r[0]):null;}
  async findMany(table:Table,o:ReadOptions={}){if(o.include){if(table!=='QualityGate'||typeof o.where?.projectId!=='string'||o.take!==undefined||o.skip!==undefined)throw new TypeError('Unsupported relation query');const result=await this.db.batch([this.select(table,o),this.stmt('SELECT e.* FROM "GateEvidence" e JOIN "QualityGate" g ON e."gateId"=g.id WHERE g."projectId"=? ORDER BY e."createdAt" DESC,e.id ASC',[o.where.projectId])]);ensure(result,2);const evidence=rows(result[1]!);return rows(result[0]!).map(r=>({...decode(r),evidence:evidence.filter(e=>e.gateId===r.id).map(decode)}));}return rows(await this.select(table,o).all()).map(decode);}
  async updateMany(table:Table,input:{where:Data;data:Data}){const w=where(table,input.where);if(!['ProjectProfile','WorkPackage','QualityGate','ArchitectureDecision','Risk','TechnicalDebt','ReleaseRecord','LessonLearned'].includes(table)||['id','projectId','createdAt'].some(k=>k in input.data)||typeof input.where.recordVersion!=='number'||input.data.recordVersion!==input.where.recordVersion+1||!w.sql||!Number.isSafeInteger(input.where.recordVersion)||typeof input.where.projectId!=='string'||(table!=='ProjectProfile'&&typeof input.where.id!=='string'))throw new TypeError('CAS identity required');const d={...input.data,updatedAt:new Date().toISOString()};const keys=Object.keys(d);const result=await this.db.batch([this.stmt(`UPDATE ${tableName(table)} SET ${keys.map(k=>col(table,k)+'=?').join(',')}${w.sql}`,[...keys.map(k=>value(k,d[k as keyof typeof d])),...w.vals])]);ensure(result,1);const count=result[0]?.meta?.changes;if(count!==0&&count!==1)throw Error('CAS result invalid; reconcile before retry');return {count};}
}
