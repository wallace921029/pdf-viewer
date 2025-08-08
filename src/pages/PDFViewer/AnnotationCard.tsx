import type { AnnotationType } from "./types";

interface Props {
  annotation: AnnotationType;
  scrollToAnnotation: (annotation: AnnotationType) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotationComment: (id: string, comment: string) => void;
}

function AnnotationCard({
  annotation,
  scrollToAnnotation,
  removeAnnotation,
  updateAnnotationComment,
}: Props) {
  return (
    <div
      key={annotation.id}
      className="annotation-item"
      data-card-id={annotation.id}
      onClick={() => scrollToAnnotation(annotation)}
      style={{ cursor: "pointer" }}
    >
      <div className="annotation-header">
        <span className="annotation-type">{annotation.type}</span>
        <span className="annotation-page">Page {annotation.pageNumber}</span>
        <button
          className="annotation-delete-card-btn"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            removeAnnotation(annotation.id);
          }}
          title="Delete annotation"
          style={{
            background: "rgba(255, 0, 0, 0.8)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "18px",
            height: "18px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: "auto",
          }}
        >
          ×
        </button>
      </div>
      {annotation.content && (
        <div className="annotation-content">"{annotation.content}"</div>
      )}
      <div className="annotation-comment">
        <textarea
          placeholder="Add a comment..."
          value={annotation.comment || ""}
          onChange={(e) => {
            e.stopPropagation(); // Prevent card click
            updateAnnotationComment(annotation.id, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()} // Prevent card click when focusing textarea
          rows={2}
          style={{
            width: "100%",
            fontSize: "11px",
            padding: "4px",
            border: "1px solid #ddd",
            borderRadius: "3px",
            resize: "none",
            marginTop: "4px",
          }}
        />
      </div>
    </div>
  );
}

export default AnnotationCard;
