/** Isolated browser QA only. Never imported or routed by the production app. */
import { createRoot } from "react-dom/client";
import { GraphIntelligenceStudio } from "../../../apps/web/app/projects/[projectId]/evidence-graph/graph-intelligence-studio";
import GraphLoading from "../../../apps/web/app/projects/[projectId]/evidence-graph/loading";
import GraphError from "../../../apps/web/app/projects/[projectId]/evidence-graph/error";

const mode = new URLSearchParams(location.search).get("case");
const graph = await fetch("/__graph-fixture?case=" + (mode ?? "normal")).then(r => r.json());
document.body.style.fontFamily = "Arial, sans-serif";
createRoot(document.getElementById("root")!).render(<div style={{ maxWidth: 1180, margin: "auto", padding: 12 }}>
  <p>Synthetic Graph QA fixture · no canonical acceptance</p>
  {mode === "loading" ? <GraphLoading /> : mode === "error" ? <GraphError reset={() => location.assign("?")} /> :
    <GraphIntelligenceStudio graph={graph} />}
</div>);
