import "pdfjs-dist";

declare module "pdfjs-dist" {
  interface PDFDocumentProxy {
    destroy(): Promise<void>;
  }
}
