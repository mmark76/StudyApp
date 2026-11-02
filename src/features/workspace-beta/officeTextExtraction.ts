import JSZip from "jszip";

export type OfficeFormat = "docx" | "pptx";
export interface OfficeTextPart { part: number; text: string }

const MAX_ARCHIVE_ENTRIES = 2_000;
const MAX_XML_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_XML_BYTES = 24 * 1024 * 1024;

function xmlText(xml: string, kind: "word" | "slide"): string {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.getElementsByTagName("parsererror").length) {
    throw new Error("The Office document contains invalid XML.");
  }
  const namespace = kind === "word"
    ? "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    : "http://schemas.openxmlformats.org/drawingml/2006/main";
  return Array.from(document.getElementsByTagNameNS(namespace, "p"))
    .map((paragraph) => Array.from(paragraph.getElementsByTagNameNS(namespace, "t"))
      .map((node) => node.textContent ?? "").join(""))
    .filter((line) => line.trim())
    .join("\n");
}

/** Extract Office text on-device; document contents are parsed as data, never executed. */
export async function extractOfficeTextParts(file: Blob, format: OfficeFormat): Promise<OfficeTextPart[]> {
  const archive = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(archive.files);
  if (entries.length > MAX_ARCHIVE_ENTRIES) throw new Error("Office archive contains too many entries.");

  const paths = format === "docx"
    ? ["word/document.xml"]
    : entries.map((entry) => entry.name)
      .filter((name) => /^ppt\/slides\/slide[1-9]\d*\.xml$/u.test(name))
      .sort((left, right) => Number(left.match(/slide(\d+)/u)?.[1]) - Number(right.match(/slide(\d+)/u)?.[1]));
  if (!paths.length || (format === "pptx" && paths.length > 500)) {
    throw new Error("No readable Office document content was found.");
  }

  let totalBytes = 0;
  const parts: OfficeTextPart[] = [];
  async function readXml(path: string, required: boolean): Promise<string> {
    const entry = archive.file(path);
    if (!entry) {
      if (required) throw new Error("Office document content is missing.");
      return "";
    }
    // JSZip records the ZIP central directory's declared uncompressed size here.
    const size = (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize;
    if (typeof size !== "number" || !Number.isFinite(size) || size > MAX_XML_BYTES || totalBytes + size > MAX_TOTAL_XML_BYTES) {
      throw new Error("Office document text is too large to process safely.");
    }
    totalBytes += size;
    const bytes = await entry.async("uint8array");
    if (bytes.byteLength > MAX_XML_BYTES) throw new Error("Office document text is too large.");
    return new TextDecoder().decode(bytes);
  }

  for (const path of paths) {
    const slideNumber = Number(path.match(/slide(\d+)\.xml$/u)?.[1]);
    const mainText = xmlText(await readXml(path, true), format === "docx" ? "word" : "slide").trim();
    const notesXml = format === "pptx"
      ? await readXml(`ppt/notesSlides/notesSlide${slideNumber}.xml`, false)
      : "";
    const notes = notesXml ? xmlText(notesXml, "slide").trim() : "";
    const text = [mainText, notes ? `Speaker notes:\n${notes}` : ""].filter(Boolean).join("\n");
    if (text) parts.push({ part: format === "docx" ? 1 : slideNumber, text });
  }
  if (!parts.length) throw new Error("This Office file contains no extractable text. Images are not analyzed yet.");
  return parts;
}
