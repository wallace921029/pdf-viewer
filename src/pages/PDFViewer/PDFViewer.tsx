import "./styles/pdf-viewer.scss";
import pdfFile from "../../assets/compressed.tracemonkey-pldi-09.pdf";
import { useEffect, useRef, useState, useCallback } from "react";
// Step 1: Import pdfjs-dist and configure worker
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
import AnnotationToolbar from "../../components/AnnotationToolbar";
import type { ToolType, ColorType } from "../../components/AnnotationToolbar";
import { renderAnnotationsForPageWithData } from "./renderAnnotationsForPageWithData";
import type { AnnotationType } from "./types";

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function PDFViewer() {
  // Remove annotation (stable callback)
  const removeAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => {
      const annotation = prev.find((ann) => ann.id === id);
      if (annotation) {
        // Re-render the page to remove the annotation element
        setTimeout(() => {
          const pageContainer = document.querySelector(
            `[data-page-number="${annotation.pageNumber}"]`
          );
          if (pageContainer) {
            const annotationLayer = pageContainer.querySelector(
              ".annotation-layer"
            ) as HTMLElement;
            if (annotationLayer) {
              const updatedAnnotations = prev.filter((ann) => ann.id !== id);
              renderAnnotationsForPageWithData(
                annotation.pageNumber,
                annotationLayer,
                updatedAnnotations,
                removeAnnotation
              );
            }
          }
        }, 50);
      }
      return prev.filter((ann) => ann.id !== id);
    });
  }, []);
  // Step 2: Add state for PDF document and loading status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [lastSelectionTime, setLastSelectionTime] = useState<number>(0);

  // Toolbar state
  const [selectedTool, setSelectedTool] = useState<ToolType>("cursor");
  const [selectedColor, setSelectedColor] = useState<ColorType>("#FFFF00");

  const [annotations, setAnnotations] = useState<AnnotationType[]>([
    {
      id: "1754623246144-0.4475432192452905",
      pageNumber: 1,
      type: "highlight",
      x: 475.5234375,
      y: 504.1328125,
      width: 358.9285888671875,
      height: 29.96875,
      content: " productivity\napplications",
      comment: "用词不准确",
      color: "rgba(255, 255, 0, 0.4)",
      pathData:
        "M 292.7947998046875 0 L 358.9285888671875 0 L 358.9285888671875 14.96875 L 66.7435302734375 14.96875 L 66.7435302734375 29.96875 L 0 29.96875 L 0 15 L 292.7947998046875 15 Z",
    },
    {
      id: "1754623271644-0.8872989495648059",
      pageNumber: 2,
      type: "rectangle",
      x: 468.90625,
      y: 98,
      width: 372,
      height: 102,
      content: "",
      comment: "代码无法跑通",
      color: "#FF0000",
    },
  ]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Rectangle drawing state
  const [isDrawingRect, setIsDrawingRect] = useState(false);
  const [rectStart, setRectStart] = useState<{
    x: number;
    y: number;
    pageNumber: number;
  } | null>(null);
  const [rectPreview, setRectPreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    pageNumber: number;
  } | null>(null);

  // Remove annotation (move up for hook order)

  // Add highlight annotation
  const addHighlightAnnotation = useCallback(
    (
      pageNumber: number,
      x: number,
      y: number,
      width: number,
      height: number,
      text: string,
      color?: string
    ) => {
      const newAnnotation = {
        id: `${Date.now()}-${Math.random()}`,
        pageNumber,
        type: "highlight" as const,
        x,
        y,
        width,
        height,
        content: text,
        comment: "",
        color: color || "rgba(255, 255, 0, 0.4)",
      };

      setAnnotations((prev) => [...prev, newAnnotation]);
      console.log("Added highlight annotation:", newAnnotation);

      // Re-render the page to show the new annotation immediately
      setTimeout(() => {
        const pageContainer = document.querySelector(
          `[data-page-number="${pageNumber}"]`
        );
        if (pageContainer) {
          const annotationLayer = pageContainer.querySelector(
            ".annotation-layer"
          ) as HTMLElement;
          if (annotationLayer) {
            // Force re-render with updated annotations
            const currentAnnotations = [...annotations, newAnnotation];
            renderAnnotationsForPageWithData(
              pageNumber,
              annotationLayer,
              currentAnnotations,
              removeAnnotation
            );
          }
        }
      }, 50);
    },
    [annotations, removeAnnotation]
  );

  // Handle text selection and create highlight annotation
  const handleTextSelection = useCallback(
    (selectedText: string) => {
      const selection = window.getSelection();
      if (!selection || !selectedText.trim() || selection.rangeCount === 0) {
        return;
      }

      // Only create highlights when brush tool is selected
      if (selectedTool !== "brush") {
        return;
      }

      // Prevent duplicate annotations by checking timing and content
      const currentTime = Date.now();
      if (currentTime - lastSelectionTime < 1500) {
        return; // Skip if selection within 1500ms (debounce)
      }

      setSelectedText(selectedText);
      setLastSelectionTime(currentTime);

      // Get selection range and position
      const range = selection.getRangeAt(0);

      // Find which page this selection belongs to
      const startContainer = range.startContainer;
      const textSpan =
        startContainer.nodeType === Node.TEXT_NODE
          ? startContainer.parentElement
          : (startContainer as Element);
      const textLayer = textSpan?.closest(".text-layer");
      const pageContainer = textSpan?.closest(".page-container");
      const pageNumber = pageContainer?.getAttribute("data-page-number");

      if (pageNumber && pageContainer && textLayer) {
        const textLayerRect = textLayer.getBoundingClientRect();

        // Convert hex color to rgba for highlighting
        const hexToRgba = (hex: string, alpha: number = 0.4) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        // Handle multiple rectangles for text that spans multiple lines
        const rects = Array.from(range.getClientRects()).filter(
          (rect) => rect.width > 0 && rect.height > 0
        );

        if (rects.length > 1) {
          // Multi-line selection: create an irregular SVG path

          // Calculate bounding box for the entire selection
          const minX = Math.min(
            ...rects.map((r: DOMRect) => r.left - textLayerRect.left)
          );
          const minY = Math.min(
            ...rects.map((r: DOMRect) => r.top - textLayerRect.top)
          );
          const maxX = Math.max(
            ...rects.map((r: DOMRect) => r.left - textLayerRect.left + r.width)
          );
          const maxY = Math.max(
            ...rects.map((r: DOMRect) => r.top - textLayerRect.top + r.height)
          );

          // Create SVG path data for rectangular step-shaped highlight
          let pathData = "";

          // Sort rectangles by vertical position (top to bottom), then by horizontal position
          const sortedRects = rects
            .map((rect: DOMRect) => ({
              x: rect.left - textLayerRect.left - minX,
              y: rect.top - textLayerRect.top - minY,
              width: rect.width,
              height: rect.height,
              right: rect.left - textLayerRect.left - minX + rect.width,
              bottom: rect.top - textLayerRect.top - minY + rect.height,
            }))
            .sort((a: any, b: any) => a.y - b.y || a.x - b.x);

          // Group rectangles by lines (similar Y positions)
          const lines: any[][] = [];
          let currentLine: any[] = [];
          let currentY = -1;

          sortedRects.forEach((rect: any) => {
            if (
              currentY === -1 ||
              Math.abs(rect.y - currentY) < rect.height / 2
            ) {
              currentLine.push(rect);
              currentY = rect.y;
            } else {
              if (currentLine.length > 0) {
                lines.push([...currentLine]);
              }
              currentLine = [rect];
              currentY = rect.y;
            }
          });
          if (currentLine.length > 0) {
            lines.push(currentLine);
          }

          // Sort rectangles within each line by X position
          lines.forEach((line) => {
            line.sort((a, b) => a.x - b.x);
          });

          // Create rectangular path that maintains right angles
          if (lines.length > 0) {
            const firstLine = lines[0];
            const lastLine = lines[lines.length - 1];

            // Start from top-left of first rectangle in first line
            pathData += `M ${firstLine[0].x} ${firstLine[0].y}`;

            // Go to top-right of last rectangle in first line
            pathData += ` L ${firstLine[firstLine.length - 1].right} ${
              firstLine[0].y
            }`;

            // For each subsequent line, create right-angle connections
            for (let i = 1; i < lines.length; i++) {
              const currentLine = lines[i];
              const prevLine = lines[i - 1];

              // Go down to current line level
              pathData += ` L ${prevLine[prevLine.length - 1].right} ${
                currentLine[0].y
              }`;

              // Go to right edge of last rectangle in current line
              pathData += ` L ${currentLine[currentLine.length - 1].right} ${
                currentLine[0].y
              }`;
            }

            // Go down to bottom of last line
            pathData += ` L ${lastLine[lastLine.length - 1].right} ${
              lastLine[0].bottom
            }`;

            // Go to left edge of first rectangle in last line
            pathData += ` L ${lastLine[0].x} ${lastLine[0].bottom}`;

            // Go up through each line from bottom to top, maintaining right angles
            for (let i = lines.length - 2; i >= 0; i--) {
              const currentLine = lines[i];
              const nextLine = lines[i + 1];

              // Go up to current line level
              pathData += ` L ${nextLine[0].x} ${currentLine[0].bottom}`;

              // Go to left edge of first rectangle in current line
              pathData += ` L ${currentLine[0].x} ${currentLine[0].bottom}`;
            }

            // Close the path back to start
            pathData += ` Z`;
          }

          // Create single annotation with path data
          const newAnnotation = {
            id: `${Date.now()}-${Math.random()}`,
            pageNumber: parseInt(pageNumber),
            type: "highlight" as const,
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            content: selectedText,
            comment: "",
            color: hexToRgba(selectedColor),
            pathData: pathData,
          };

          setAnnotations((prev) => [...prev, newAnnotation]);
          console.log("Added multi-line path highlight:", newAnnotation);

          // Re-render the page
          setTimeout(() => {
            const pageContainer = document.querySelector(
              `[data-page-number="${pageNumber}"]`
            );
            if (pageContainer) {
              const annotationLayer = pageContainer.querySelector(
                ".annotation-layer"
              ) as HTMLElement;
              if (annotationLayer) {
                const currentAnnotations = [...annotations, newAnnotation];
                renderAnnotationsForPageWithData(
                  parseInt(pageNumber),
                  annotationLayer,
                  currentAnnotations,
                  removeAnnotation
                );
              }
            }
          }, 50);
        } else if (rects.length === 1) {
          // Single line selection: use rectangle
          const rect = rects[0];
          const relativeX = rect.left - textLayerRect.left;
          const relativeY = rect.top - textLayerRect.top;

          addHighlightAnnotation(
            parseInt(pageNumber),
            relativeX,
            relativeY,
            rect.width,
            rect.height,
            selectedText,
            hexToRgba(selectedColor)
          );
        }
      }

      console.log("Selected text:", selectedText);

      // Clear selection after creating annotation
      setTimeout(() => {
        selection.removeAllRanges();
      }, 100);
    },
    [
      lastSelectionTime,
      addHighlightAnnotation,
      selectedTool,
      selectedColor,
      annotations,
      removeAnnotation,
    ]
  );

  // Render annotations for a specific page
  const renderAnnotationsForPage = useCallback(
    (pageNumber: number, annotationLayer: HTMLElement) => {
      renderAnnotationsForPageWithData(
        pageNumber,
        annotationLayer,
        annotations,
        removeAnnotation
      );
    },
    [annotations, removeAnnotation]
  );

  // Update annotation comment
  const updateAnnotationComment = (id: string, comment: string) => {
    setAnnotations((prev) =>
      prev.map((ann) => (ann.id === id ? { ...ann, comment } : ann))
    );
  };

  // Scroll to annotation on page
  const scrollToAnnotation = (annotation: (typeof annotations)[0]) => {
    const pageContainer = document.querySelector(
      `[data-page-number="${annotation.pageNumber}"]`
    );
    if (pageContainer) {
      pageContainer.scrollIntoView({ behavior: "smooth", block: "center" });

      // Highlight the annotation briefly - look for the SVG element with the annotation ID
      const annotationElement = pageContainer.querySelector(
        `svg[data-annotation-id="${annotation.id}"]`
      );
      if (annotationElement) {
        (annotationElement as HTMLElement).style.filter =
          "drop-shadow(0 0 10px rgba(255, 0, 0, 0.8))";
        setTimeout(() => {
          (annotationElement as HTMLElement).style.filter = "";
        }, 2000);
      }
    }
  };

  // Add selection event listener
  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(() => {
        const selection = window.getSelection();
        if (
          selection &&
          selection.toString().trim() !== "" &&
          selection.rangeCount > 0
        ) {
          const selectedText = selection.toString();
          handleTextSelection(selectedText);
        }
      }, 100);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Handle keyboard selection (Shift + arrow keys, Ctrl+A, etc.)
      if (
        e.shiftKey ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown"
      ) {
        setTimeout(() => {
          const selection = window.getSelection();
          if (
            selection &&
            selection.toString().trim() !== "" &&
            selection.rangeCount > 0
          ) {
            const selectedText = selection.toString();
            handleTextSelection(selectedText);
          }
        }, 100);
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleTextSelection]); // Add handleTextSelection as dependency

  // Step 2: Load PDF when component mounts
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(pdfFile);
        const pdf = await loadingTask.promise;

        console.log("PDF loaded successfully, pages:", pdf.numPages);

        // Render all pages
        await renderAllPages(pdf);
      } catch (err: any) {
        setError(err.message);
        console.error("Error loading PDF:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removeAnnotation]); // renderAllPages is stable, no need to include it

  // Step 2: Function to render all pages with text layers
  const renderAllPages = useCallback(
    async (pdf: pdfjsLib.PDFDocumentProxy) => {
      if (!containerRef.current) return;

      // Clear container
      containerRef.current.innerHTML = "";

      // Render each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);

          // Set up viewport - use same scale for both canvas and text layer
          const scale = 1.5;
          const viewport = page.getViewport({ scale: scale });

          // Create page container
          const pageContainer = document.createElement("div");
          pageContainer.className = "page-container";
          pageContainer.setAttribute("data-page-number", pageNum.toString());
          pageContainer.style.position = "relative";
          pageContainer.style.display = "block";
          pageContainer.style.margin = "16px auto";
          pageContainer.style.width = `${viewport.width}px`;
          pageContainer.style.height = `${viewport.height}px`;
          pageContainer.style.boxShadow = "0 0 4px 0 #dedede";

          // Create canvas for this page
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.style.position = "absolute";
          canvas.style.left = "0";
          canvas.style.top = "0";

          // Create text layer container
          const textLayerDiv = document.createElement("div");
          textLayerDiv.className = "text-layer selectable";
          textLayerDiv.style.position = "absolute";
          textLayerDiv.style.left = "0";
          textLayerDiv.style.top = "0";
          textLayerDiv.style.right = "0";
          textLayerDiv.style.bottom = "0";
          textLayerDiv.style.overflow = "hidden";
          textLayerDiv.style.opacity = "1";
          textLayerDiv.style.lineHeight = "1.0";
          textLayerDiv.style.zIndex = "2";
          textLayerDiv.style.userSelect = "text"; // Explicitly enable text selection
          textLayerDiv.style.pointerEvents = "auto"; // Enable pointer events for selection
          textLayerDiv.style.setProperty(
            "--total-scale-factor",
            scale.toString()
          );

          // Create annotation layer container
          const annotationLayerDiv = document.createElement("div");
          annotationLayerDiv.className = "annotation-layer";
          annotationLayerDiv.setAttribute(
            "data-page-number",
            pageNum.toString()
          );
          annotationLayerDiv.style.position = "absolute";
          annotationLayerDiv.style.left = "0";
          annotationLayerDiv.style.top = "0";
          annotationLayerDiv.style.right = "0";
          annotationLayerDiv.style.bottom = "0";
          annotationLayerDiv.style.pointerEvents = "none";
          annotationLayerDiv.style.zIndex = "3";

          // Add double-click event listener to text layer for annotation creation
          // (Removed - now using text selection for highlighting)

          // Render existing annotations for this page
          renderAnnotationsForPage(pageNum, annotationLayerDiv);

          // Render page
          const renderContext = {
            canvas: canvas,
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;

          // Render text layer using same viewport
          const textContent = await page.getTextContent();
          const textLayer = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport,
          });

          await textLayer.render();

          // Assemble the page
          pageContainer.appendChild(canvas);
          pageContainer.appendChild(textLayerDiv);
          pageContainer.appendChild(annotationLayerDiv);
          containerRef.current.appendChild(pageContainer);

          console.log(`Page ${pageNum} rendered successfully with text layer`);
        } catch (err) {
          console.error(`Error rendering page ${pageNum}:`, err);
        }
      }
    },
    [renderAnnotationsForPage]
  );

  // Rectangle drawing mouse handlers
  useEffect(() => {
    if (selectedTool !== "rectangle") return;

    function getPageAndLayer(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const annotationLayer = target.closest(
        ".annotation-layer"
      ) as HTMLElement;
      const pageContainer = annotationLayer?.closest(".page-container");
      const pageNumber = pageContainer?.getAttribute("data-page-number");
      return {
        annotationLayer,
        pageNumber: pageNumber ? parseInt(pageNumber) : null,
      };
    }

    function handleMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;
      const { annotationLayer, pageNumber } = getPageAndLayer(e);
      if (annotationLayer && pageNumber) {
        const rect = annotationLayer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawingRect(true);
        setRectStart({ x, y, pageNumber });
        setRectPreview({ x, y, width: 0, height: 0, pageNumber });
      }
    }

    function handleMouseMove(e: MouseEvent) {
      if (!isDrawingRect || !rectStart) return;
      const { annotationLayer } = getPageAndLayer(e);
      if (annotationLayer) {
        const rect = annotationLayer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setRectPreview({
          x: Math.min(rectStart.x, x),
          y: Math.min(rectStart.y, y),
          width: Math.abs(x - rectStart.x),
          height: Math.abs(y - rectStart.y),
          pageNumber: rectStart.pageNumber,
        });
      }
    }

    function handleMouseUp() {
      if (!isDrawingRect || !rectStart || !rectPreview) return;
      setIsDrawingRect(false);
      setRectStart(null);
      setRectPreview(null);
      if (rectPreview.width > 5 && rectPreview.height > 5) {
        const newAnnotation = {
          id: `${Date.now()}-${Math.random()}`,
          pageNumber: rectPreview.pageNumber,
          type: "rectangle" as const,
          x: rectPreview.x,
          y: rectPreview.y,
          width: rectPreview.width,
          height: rectPreview.height,
          content: "",
          comment: "",
          color: selectedColor,
        };
        setAnnotations((prev) => {
          const updated = [...prev, newAnnotation];
          // Immediately re-render annotation layer for this page
          setTimeout(() => {
            const pageContainer = document.querySelector(
              `[data-page-number="${rectPreview.pageNumber}"]`
            );
            if (pageContainer) {
              const annotationLayer = pageContainer.querySelector(
                ".annotation-layer"
              ) as HTMLElement;
              if (annotationLayer) {
                renderAnnotationsForPageWithData(
                  rectPreview.pageNumber,
                  annotationLayer,
                  updated,
                  removeAnnotation
                );
              }
            }
          }, 50);
          return updated;
        });
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    selectedTool,
    isDrawingRect,
    rectStart,
    rectPreview,
    selectedColor,
    removeAnnotation,
  ]);

  // Render rectangle preview
  useEffect(() => {
    if (!rectPreview) return;
    const pageContainer = document.querySelector(
      `[data-page-number="${rectPreview.pageNumber}"]`
    );
    const annotationLayer = pageContainer?.querySelector(
      ".annotation-layer"
    ) as HTMLElement;
    if (!annotationLayer) return;
    let svg = annotationLayer.querySelector(
      ".temp-rect-preview"
    ) as SVGSVGElement;
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("temp-rect-preview");
      svg.style.position = "absolute";
      svg.style.pointerEvents = "none";
      annotationLayer.appendChild(svg);
    }
    svg.style.left = `${rectPreview.x}px`;
    svg.style.top = `${rectPreview.y}px`;
    svg.style.width = `${rectPreview.width}px`;
    svg.style.height = `${rectPreview.height}px`;
    svg.innerHTML = `<rect x="0" y="0" width="${rectPreview.width}" height="${rectPreview.height}" fill="none" stroke="${selectedColor}" stroke-width="2" stroke-dasharray="5,5" />`;
    return () => {
      if (svg) svg.remove();
    };
  }, [rectPreview, selectedColor]);

  // Toggle pointer-events for annotation-layer based on tool
  useEffect(() => {
    const annotationLayers = document.querySelectorAll(".annotation-layer");
    annotationLayers.forEach((layer) => {
      if (selectedTool === "rectangle") {
        (layer as HTMLElement).style.pointerEvents = "auto";
      } else {
        (layer as HTMLElement).style.pointerEvents = "none";
      }
    });
  }, [selectedTool, annotations]);

  const handleSave = () => {
    // log the annotations to console
    console.log("Saving annotations:", annotations);
  };

  return (
    <div className="pdf-viewer">
      <div className="title-bar">
        <div className="report-title">双缝干涉实验报告</div>
        <div className="student-info">
          <span>萨克斯牛顿</span>
          <span>三年2班</span>
          <span>2025年8月12日</span>
        </div>
        {loading && <p>Loading PDF...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
      </div>

      <div className="tool-bar">
        <AnnotationToolbar
          selectedTool={selectedTool}
          selectedColor={selectedColor}
          onToolChange={setSelectedTool}
          onColorChange={setSelectedColor}
        />
      </div>

      <div className="body-container">
        <div
          className={`pdf-container ${
            selectedTool === "brush"
              ? "brush-mode"
              : selectedTool === "rectangle"
              ? "rectangle-mode"
              : ""
          }`}
        >
          <div className="canvas-container" ref={containerRef} style={{}} />
        </div>

        <div className="annotation-container">
          <div className="selected-text-display">
            <h4>Selected Text:</h4>
            <p>{selectedText || "No text selected"}</p>
          </div>

          <div className="annotations-display">
            <h4>Annotations ({annotations.length}):</h4>
            <div className="annotations-list">
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="annotation-item"
                  data-card-id={annotation.id}
                  onClick={() => scrollToAnnotation(annotation)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="annotation-header">
                    <span className="annotation-type">{annotation.type}</span>
                    <span className="annotation-page">
                      Page {annotation.pageNumber}
                    </span>
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
                    <div className="annotation-content">
                      "{annotation.content}"
                    </div>
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
              ))}
              {annotations.length === 0 && (
                <p className="no-annotations">
                  No annotations yet. Select text to create a highlight
                  annotation.
                </p>
              )}
            </div>
          </div>

          <div className="actions">
            <button className="action-btn cancel-btn">Cancel</button>
            <button className="action-btn save-btn" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;
