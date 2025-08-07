import "./styles/pdf-viewer.scss";
import pdfFile from "../../assets/compressed.tracemonkey-pldi-09.pdf";
import { useEffect, useRef, useState } from "react";
// Step 1: Import pdfjs-dist and configure worker
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function PDFViewer() {
  // Step 2: Add state for PDF document and loading status
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [annotations, setAnnotations] = useState<Array<{
    id: string;
    pageNumber: number;
    type: 'highlight' | 'note' | 'drawing';
    x: number;
    y: number;
    width?: number;
    height?: number;
    content?: string;
    color?: string;
  }>>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== "") {
      setSelectedText(selection.toString());
      console.log("Selected text:", selection.toString());
    }
  };

  // Add annotation
  const addAnnotation = (pageNumber: number, x: number, y: number, type: 'highlight' | 'note' | 'drawing') => {
    const newAnnotation = {
      id: Date.now().toString(),
      pageNumber,
      type,
      x,
      y,
      content: type === 'note' ? 'New note' : '',
      color: type === 'highlight' ? '#ffff00' : '#ffc107'
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);
    console.log('Added annotation:', newAnnotation);
  };

  // Handle double click on annotation layer to add note
  const handleAnnotationLayerDoubleClick = (event: MouseEvent, pageNumber: number) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    addAnnotation(pageNumber, x, y, 'note');
  };

  // Add selection event listener
  useEffect(() => {
    const handleSelectionChange = () => {
      handleTextSelection();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Step 2: Load PDF when component mounts
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(pdfFile);
        const pdf = await loadingTask.promise;

        setPdfDoc(pdf);
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
  }, []);

  // Step 2: Function to render all pages with text layers
  const renderAllPages = async (pdf: pdfjsLib.PDFDocumentProxy) => {
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
        textLayerDiv.style.setProperty(
          "--total-scale-factor",
          scale.toString()
        );

        // Create annotation layer container
        const annotationLayerDiv = document.createElement("div");
        annotationLayerDiv.className = "annotation-layer";
        annotationLayerDiv.setAttribute("data-page-number", pageNum.toString());
        annotationLayerDiv.style.position = "absolute";
        annotationLayerDiv.style.left = "0";
        annotationLayerDiv.style.top = "0";
        annotationLayerDiv.style.right = "0";
        annotationLayerDiv.style.bottom = "0";
        annotationLayerDiv.style.pointerEvents = "none";
        annotationLayerDiv.style.zIndex = "3";

        // Add double-click event listener to text layer for annotation creation
        textLayerDiv.addEventListener("dblclick", (event) => {
          // Only create annotation if not clicking on text spans
          if ((event.target as HTMLElement).tagName !== 'SPAN') {
            handleAnnotationLayerDoubleClick(event, pageNum);
          }
        });

        // Render existing annotations for this page
        const pageAnnotations = annotations.filter(ann => ann.pageNumber === pageNum);
        pageAnnotations.forEach(annotation => {
          if (annotation.type === 'note') {
            const noteElement = document.createElement("div");
            noteElement.className = "annotation-note";
            noteElement.style.left = `${annotation.x}px`;
            noteElement.style.top = `${annotation.y}px`;
            noteElement.style.pointerEvents = "auto"; // Enable pointer events for note elements
            noteElement.textContent = "📝";
            noteElement.title = annotation.content || "Note";
            annotationLayerDiv.appendChild(noteElement);
          }
        });

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
  };

  return (
    <div className="pdf-viewer">
      <div className="title-bar">
        {loading && <p>Loading PDF...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
      </div>

      <div className="body-container">
        <div className="pdf-container">
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
              {annotations.map(annotation => (
                <div key={annotation.id} className="annotation-item">
                  <div className="annotation-header">
                    <span className="annotation-type">{annotation.type}</span>
                    <span className="annotation-page">Page {annotation.pageNumber}</span>
                  </div>
                  {annotation.content && (
                    <div className="annotation-content">{annotation.content}</div>
                  )}
                </div>
              ))}
              {annotations.length === 0 && (
                <p className="no-annotations">No annotations yet. Double-click on any page to add a note.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;
