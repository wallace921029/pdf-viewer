export type AnnotationType = {
  id: string;
  pageNumber: number;
  type: "highlight" | "note" | "drawing" | "rectangle";
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  comment?: string;
  color?: string;
  pathData?: string;
};
