import { acquisitionTargets } from "../../archive/canonical-data.generated";
import AcquisitionPlanner from "./planner";

export default function AcquisitionPlannerPage() {
  return <AcquisitionPlanner records={acquisitionTargets} />;
}
