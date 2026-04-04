import { Card } from "@verdicta/ui";
import { useParams } from "react-router-dom";
import { AnnotationLayer } from "@/components/viewer/annotation-layer";
import { ChunkJumpList } from "@/components/viewer/chunk-jump-list";
import { PdfViewer } from "@/components/viewer/pdf-viewer";
import { TextViewer } from "@/components/viewer/text-viewer";
import { useDocumentDetail } from "@/hooks/use-verdicta-query";

export const DocumentViewerScreen = () => {
  const { documentId } = useParams();
  const { data: document } = useDocumentDetail(documentId);

  if (!document) {
    return <Card>Document not found.</Card>;
  }

  const isPdf = document.documentType === "pdf";

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      {isPdf ? <PdfViewer document={document} /> : <TextViewer document={document} />}
      <div className="space-y-4">
        <Card className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Inspector</div>
          <div className="text-lg font-semibold">{document.title}</div>
          <div className="text-sm text-muted-foreground">{document.citation ?? document.fileName}</div>
        </Card>
        <AnnotationLayer document={document} />
        <Card>
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Chunk navigation</div>
          <div className="mt-4">
            <ChunkJumpList chunks={document.chunks} />
          </div>
        </Card>
      </div>
    </div>
  );
};
