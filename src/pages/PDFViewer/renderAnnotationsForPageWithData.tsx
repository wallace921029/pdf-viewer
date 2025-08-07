import type { AnnotationType } from "./types";

export function renderAnnotationsForPageWithData(
  pageNumber: number,
  annotationLayer: HTMLElement,
  annotationsData: AnnotationType[],
  removeAnnotation: (id: string) => void
) {
  // Clear existing annotations
  annotationLayer.innerHTML = "";

  const pageAnnotations = annotationsData.filter(
    (ann) => ann.pageNumber === pageNumber
  );
  pageAnnotations.forEach((annotation) => {
    if (
      (annotation.type === "highlight" || annotation.type === "rectangle") &&
      annotation.width &&
      annotation.height
    ) {
      // Create individual SVG element for each annotation
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.style.position = "absolute";
      svg.style.left = `${annotation.x}px`;
      svg.style.top = `${annotation.y}px`;
      svg.style.width = `${annotation.width}px`;
      svg.style.height = `${annotation.height}px`;
      svg.style.pointerEvents = "none";
      svg.style.zIndex = "1";
      svg.dataset.annotationId = annotation.id;

      if (annotation.type === "highlight") {
        if (annotation.pathData) {
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          path.setAttribute("d", annotation.pathData);
          path.setAttribute(
            "fill",
            annotation.color || "rgba(255, 255, 0, 0.4)"
          );
          path.setAttribute("stroke", "none");
          path.style.pointerEvents = "auto";
          path.style.cursor = "pointer";

          path.addEventListener("click", () => {
            const annotationCard = document.querySelector(
              `[data-card-id="${annotation.id}"]`
            );
            if (annotationCard) {
              annotationCard.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              (annotationCard as HTMLElement).style.boxShadow =
                "0 0 10px rgba(255, 0, 0, 0.8)";
              setTimeout(() => {
                (annotationCard as HTMLElement).style.boxShadow = "";
              }, 2000);
            }
          });

          path.addEventListener("mouseenter", () => {
            const currentFill =
              path.getAttribute("fill") || "rgba(255, 255, 0, 0.4)";
            path.setAttribute("fill", currentFill.replace("0.4)", "0.6)"));
          });

          path.addEventListener("mouseleave", () => {
            path.setAttribute(
              "fill",
              annotation.color || "rgba(255, 255, 0, 0.4)"
            );
          });

          svg.appendChild(path);

          // Add delete button for path-based highlights
          const deleteButton = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          deleteButton.setAttribute("cx", (annotation.width - 10).toString());
          deleteButton.setAttribute("cy", "10");
          deleteButton.setAttribute("r", "8");
          deleteButton.setAttribute("fill", "rgba(255, 0, 0, 0.8)");
          deleteButton.setAttribute("stroke", "white");
          deleteButton.setAttribute("stroke-width", "1");
          deleteButton.style.cursor = "pointer";
          deleteButton.style.pointerEvents = "auto";
          deleteButton.classList.add("annotation-delete-btn");

          const deleteX = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          deleteX.setAttribute("x", (annotation.width - 10).toString());
          deleteX.setAttribute("y", "14");
          deleteX.setAttribute("text-anchor", "middle");
          deleteX.setAttribute("font-family", "Arial, sans-serif");
          deleteX.setAttribute("font-size", "10");
          deleteX.setAttribute("fill", "white");
          deleteX.setAttribute("font-weight", "bold");
          deleteX.textContent = "×";
          deleteX.style.cursor = "pointer";
          deleteX.style.pointerEvents = "auto";
          deleteX.classList.add("annotation-delete-btn");

          const handleDelete = (e: Event) => {
            e.stopPropagation();
            removeAnnotation(annotation.id);
          };

          deleteButton.addEventListener("click", handleDelete);
          deleteX.addEventListener("click", handleDelete);

          svg.appendChild(deleteButton);
          svg.appendChild(deleteX);
        } else {
          // Rectangle highlight (single-line)
          const rect = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );
          rect.setAttribute("x", "0");
          rect.setAttribute("y", "0");
          rect.setAttribute("width", annotation.width.toString());
          rect.setAttribute("height", annotation.height.toString());
          rect.setAttribute(
            "fill",
            annotation.color || "rgba(255, 255, 0, 0.4)"
          );
          rect.setAttribute("stroke", "none");
          rect.style.pointerEvents = "auto";
          rect.style.cursor = "pointer";

          // Add click and hover handlers
          rect.addEventListener("click", () => {
            const annotationCard = document.querySelector(
              `[data-card-id="${annotation.id}"]`
            );
            if (annotationCard) {
              annotationCard.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              (annotationCard as HTMLElement).style.boxShadow =
                "0 0 10px rgba(255, 0, 0, 0.8)";
              setTimeout(() => {
                (annotationCard as HTMLElement).style.boxShadow = "";
              }, 2000);
            }
          });

          rect.addEventListener("mouseenter", () => {
            const currentFill =
              rect.getAttribute("fill") || "rgba(255, 255, 0, 0.4)";
            rect.setAttribute("fill", currentFill.replace("0.4)", "0.6)"));
          });

          rect.addEventListener("mouseleave", () => {
            rect.setAttribute(
              "fill",
              annotation.color || "rgba(255, 255, 0, 0.4)"
            );
          });

          svg.appendChild(rect);

          // Add delete button for rectangle-based highlights
          const deleteButton = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          deleteButton.setAttribute("cx", (annotation.width - 10).toString());
          deleteButton.setAttribute("cy", "10");
          deleteButton.setAttribute("r", "8");
          deleteButton.setAttribute("fill", "rgba(255, 0, 0, 0.8)");
          deleteButton.setAttribute("stroke", "white");
          deleteButton.setAttribute("stroke-width", "1");
          deleteButton.style.cursor = "pointer";
          deleteButton.style.pointerEvents = "auto";
          deleteButton.classList.add("annotation-delete-btn");

          const deleteX = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );
          deleteX.setAttribute("x", (annotation.width - 10).toString());
          deleteX.setAttribute("y", "14");
          deleteX.setAttribute("text-anchor", "middle");
          deleteX.setAttribute("font-family", "Arial, sans-serif");
          deleteX.setAttribute("font-size", "10");
          deleteX.setAttribute("fill", "white");
          deleteX.setAttribute("font-weight", "bold");
          deleteX.textContent = "×";
          deleteX.style.cursor = "pointer";
          deleteX.style.pointerEvents = "auto";
          deleteX.classList.add("annotation-delete-btn");

          const handleDelete = (e: Event) => {
            e.stopPropagation();
            removeAnnotation(annotation.id);
          };

          deleteButton.addEventListener("click", handleDelete);
          deleteX.addEventListener("click", handleDelete);

          svg.appendChild(deleteButton);
          svg.appendChild(deleteX);
        }
      } else if (annotation.type === "rectangle") {
        // Rectangle annotation
        const rect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        rect.setAttribute("width", annotation.width.toString());
        rect.setAttribute("height", annotation.height.toString());
        rect.setAttribute("fill", "none");
        rect.setAttribute("stroke", annotation.color || "#FF0000");
        rect.setAttribute("stroke-width", "2");
        rect.style.pointerEvents = "auto";
        rect.style.cursor = "pointer";

        rect.addEventListener("click", () => {
          const annotationCard = document.querySelector(
            `[data-card-id="${annotation.id}"]`
          );
          if (annotationCard) {
            annotationCard.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            (annotationCard as HTMLElement).style.boxShadow =
              "0 0 10px rgba(255, 0, 0, 0.8)";
            setTimeout(() => {
              (annotationCard as HTMLElement).style.boxShadow = "";
            }, 2000);
          }
        });

        svg.appendChild(rect);

        // Add delete button for rectangle annotations
        const deleteButton = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        deleteButton.setAttribute("cx", (annotation.width - 10).toString());
        deleteButton.setAttribute("cy", "10");
        deleteButton.setAttribute("r", "8");
        deleteButton.setAttribute("fill", "rgba(255, 0, 0, 0.8)");
        deleteButton.setAttribute("stroke", "white");
        deleteButton.setAttribute("stroke-width", "1");
        deleteButton.style.cursor = "pointer";
        deleteButton.style.pointerEvents = "auto";
        deleteButton.classList.add("annotation-delete-btn");

        const deleteX = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        deleteX.setAttribute("x", (annotation.width - 10).toString());
        deleteX.setAttribute("y", "14");
        deleteX.setAttribute("text-anchor", "middle");
        deleteX.setAttribute("font-family", "Arial, sans-serif");
        deleteX.setAttribute("font-size", "10");
        deleteX.setAttribute("fill", "white");
        deleteX.setAttribute("font-weight", "bold");
        deleteX.textContent = "×";
        deleteX.style.cursor = "pointer";
        deleteX.style.pointerEvents = "auto";
        deleteX.classList.add("annotation-delete-btn");

        const handleDelete = (e: Event) => {
          e.stopPropagation();
          removeAnnotation(annotation.id);
        };

        deleteButton.addEventListener("click", handleDelete);
        deleteX.addEventListener("click", handleDelete);

        svg.appendChild(deleteButton);
        svg.appendChild(deleteX);
      }
      annotationLayer.appendChild(svg);
    }
  });
}
