import { useEffect, useRef } from "react";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build//pdf.worker.mjs?url";
import { TextLayerBuilder } from "pdfjs-dist/web/pdf_viewer.mjs";

// 🔽 引入样式（可选，但推荐）
import "pdfjs-dist/web/pdf_viewer.css";
import pdfFile from "../../assets/file-example_PDF_1MB.pdf";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

function PDFViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);

  // 🔽 保存当前的 renderTask 和 textLayerBuilder，用于取消
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
  const textLayerBuilderRef = useRef<TextLayerBuilder | null>(null);

  // 🔽 处理文本选中事件
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString();
      console.log("选中的文本:", selectedText);
    }
  };

  const renderPdf = async () => {
    try {
      const loadingTask = pdfjs.getDocument(pdfFile);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      console.log("> viewport");
      console.log(viewport);

      const canvas = canvasRef.current!;
      const context = canvas.getContext("2d")!;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // ✅ 1. 取消前一个渲染任务（关键！）
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      // ✅ 2. 渲染 Canvas
      const renderContext = {
        canvas,
        canvasContext: context,
        viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask; // 保存引用

      try {
        await renderTask.promise; // 等待完成
      } catch (error: any) {
        if (error.name === "RenderingCancelledException") {
          console.log("Rendering was cancelled");
          return; // 被取消是正常行为，不要抛错
        }
        throw error;
      }

      // ✅ 3. 渲染 TextLayer
      const textLayerDiv = textLayerRef.current!;
      textLayerDiv.style.width = `${viewport.width}px`;
      textLayerDiv.style.height = `${viewport.height}px`;

      // 清空旧的文本层
      textLayerDiv.innerHTML = "";
      // 取消前一个文本层渲染（如果有）
      if (textLayerBuilderRef.current) {
        textLayerBuilderRef.current.cancel();
        textLayerBuilderRef.current = null;
      }

      const textLayerBuilder = new TextLayerBuilder({
        pdfPage: page,
        onAppend: () => {},
      });

      textLayerBuilderRef.current = textLayerBuilder;

      await textLayerBuilder.render({
        viewport,
      });

      if (textLayerBuilder.div) {
        textLayerDiv.appendChild(textLayerBuilder.div);
      }
    } catch (error: any) {
      if (error.name !== "RenderingCancelledException") {
        console.error("Error rendering PDF:", error);
      }
    }
  };

  useEffect(() => {
    renderPdf();

    // 🔽 清理函数：组件卸载时取消所有任务
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
      if (textLayerBuilderRef.current) {
        textLayerBuilderRef.current.cancel();
      }
    };
  }, []);


  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} />
      <div
        ref={textLayerRef}
        className="textLayer" // pdf_viewer.css 会处理样式
        onMouseUp={handleTextSelection}
        onKeyUp={handleTextSelection}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          overflow: "hidden",
          pointerEvents: "auto", // 允许指针事件以便文本选中
          userSelect: "text", // 允许文本选中
        }}
      />
    </div>
  );
}
export default PDFViewer;
