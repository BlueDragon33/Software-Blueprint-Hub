import type { D1Binding, D1Statement, SqlValue } from "./d1-domain-store";
export interface D1CanonicalStatement extends D1Statement {
  bind(...values:SqlValue[]):D1CanonicalStatement;
  first():Promise<unknown>;
}
export interface D1CanonicalBinding extends D1Binding {
  prepare(sql:string):D1CanonicalStatement;
}
