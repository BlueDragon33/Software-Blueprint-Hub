export function createRequestRuntimeScope<D>(): {
  run<T>(runtime:D,callback:()=>T):T;
  select<P>(mode:string|undefined,postgres:()=>P):D|P;
  hasD1Context():boolean;
};
