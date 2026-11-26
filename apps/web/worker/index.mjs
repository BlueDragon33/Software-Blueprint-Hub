// Candidate Vinext host entry. Build this source in the same Worker module
// graph as the application; do not splice it into a generated bundle.
import handler from "vinext/server/app-router-entry";
import { runWithD1WorkerRuntime } from "../src/server/runtime.ts";
import { createD1WorkerHost } from "./d1-worker-host.mjs";
export default createD1WorkerHost(handler,runWithD1WorkerRuntime);
