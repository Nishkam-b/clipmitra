import { Suspense } from "react";
import EditorView from "./EditorView";

// EditorView reads the clip id with useParams(); Next 16 requires that inside <Suspense>.
export default function EditClipPage() {
  return (
    <Suspense fallback={null}>
      <EditorView />
    </Suspense>
  );
}
