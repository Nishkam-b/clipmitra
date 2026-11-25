import { Suspense } from "react";
import JobView from "./JobView";

// JobView reads the job id with useParams(); Next 16 requires that inside <Suspense>.
export default function JobPage() {
  return (
    <Suspense fallback={null}>
      <JobView />
    </Suspense>
  );
}
