import { createHashRouter } from "react-router";
import Homepage from "../pages/Homepage/Homepage";
import PDFViewer from "../pages/PDFViewer/PDFViewer";

const router = createHashRouter([
  {
    path: "/",
    element: <Homepage />,
  },
  {
    path: "/pdf",
    element: <PDFViewer />,
  },
]);

export default router;
