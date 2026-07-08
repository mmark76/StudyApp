import "pdfjs-dist";
import "pdfjs-dist/types/src/display/api";

declare module "pdfjs-dist" {
  interface PDFDocumentProxy {
    destroy(): Promise<void>;
  }
}

declare module "pdfjs-dist/types/src/display/api" {
  interface PDFDocumentProxy {
    destroy(): Promise<void>;
  }
}
