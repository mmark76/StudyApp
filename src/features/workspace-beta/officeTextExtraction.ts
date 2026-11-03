import JSZip from "jszip";

export type OfficeFormat = "docx" | "pptx";
export interface OfficeTextPart { part: number; text: string; section?: string }

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
export async function extractOfficeTextParts(file: Blob, format: OfficeFormat, options: { complete?: boolean } = {}): Promise<OfficeTextPart[]> {
  const archive = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(archive.files);
  if (entries.length > MAX_ARCHIVE_ENTRIES) throw new Error("Office archive contains too many entries.");

  let paths = format === "docx"
    ? options.complete
      ? ["word/document.xml", ...entries.map((entry) => entry.name)
        .filter((name) => /^word\/(?:header\d+|footer\d+|footnotes|endnotes|comments)\.xml$/u.test(name)).sort()]
      : ["word/document.xml"]
    : entries.map((entry) => entry.name)
      .filter((name) => /^ppt\/slides\/slide[1-9]\d*\.xml$/u.test(name))
      .sort((left, right) => Number(left.match(/slide(\d+)/u)?.[1]) - Number(right.match(/slide(\d+)/u)?.[1]));
  if (!paths.length || (format === "pptx" && paths.length > 500 && !options.complete)) {
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
    const maxXmlBytes = options.complete ? 100 * 1024 * 1024 : MAX_XML_BYTES;
    const maxTotalXmlBytes = options.complete ? 256 * 1024 * 1024 : MAX_TOTAL_XML_BYTES;
    if (typeof size !== "number" || !Number.isFinite(size) || size > maxXmlBytes || totalBytes + size > maxTotalXmlBytes) {
      throw new Error("Office document text is too large to process safely.");
    }
    totalBytes += size;
    const bytes = await entry.async("uint8array");
    if (bytes.byteLength > maxXmlBytes) throw new Error("Office document text is too large.");
    return new TextDecoder().decode(bytes);
  }

  if (format === "pptx" && options.complete) {
    const presentation = new DOMParser().parseFromString(await readXml("ppt/presentation.xml", true), "application/xml");
    const relationships = new DOMParser().parseFromString(await readXml("ppt/_rels/presentation.xml.rels", true), "application/xml");
    if (presentation.getElementsByTagName("parsererror").length || relationships.getElementsByTagName("parsererror").length) {
      throw new Error("The PowerPoint slide order could not be read.");
    }
    const relationshipTargets = new Map(Array.from(relationships.getElementsByTagName("Relationship"))
      .filter((item) => item.getAttribute("Type")?.endsWith("/slide"))
      .map((item) => [item.getAttribute("Id"), item.getAttribute("Target")].filter(Boolean) as [string, string]));
    const slideIds = Array.from(presentation.getElementsByTagNameNS("http://schemas.openxmlformats.org/presentationml/2006/main", "sldId"));
    paths = slideIds.map((item) => {
      const id = item.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ?? item.getAttribute("r:id");
      const target = relationshipTargets.get(id ?? "");
      const match = target?.match(/(?:^|\/)slides\/slide([1-9]\d*)\.xml$/u);
      if (!match) throw new Error("A PowerPoint slide could not be mapped to its original order.");
      const path = `ppt/slides/slide${match[1]}.xml`;
      if (!archive.file(path)) throw new Error(`PowerPoint slide content is missing: ${path}`);
      return path;
    });
    if (!paths.length || new Set(paths).size !== paths.length) throw new Error("The PowerPoint slide list is incomplete or duplicated.");
  }

  const notesForSlide = new Map<string, string>();
  if (format === "pptx" && options.complete) {
    const notesPaths = new Set(entries.map((entry) => entry.name)
      .filter((name) => /^ppt\/notesSlides\/notesSlide[1-9]\d*\.xml$/u.test(name)));
    const mappedNotes = new Set<string>();
    for (const path of paths) {
      const relationshipPath = path.replace("ppt/slides/", "ppt/slides/_rels/") + ".rels";
      const xml = await readXml(relationshipPath, false);
      if (!xml) continue;
      const relationships = new DOMParser().parseFromString(xml, "application/xml");
      if (relationships.getElementsByTagName("parsererror").length) throw new Error(`Invalid slide relationships: ${path}`);
      const noteLinks = Array.from(relationships.getElementsByTagName("Relationship"))
        .filter((item) => item.getAttribute("Type")?.endsWith("/notesSlide"));
      if (noteLinks.length > 1) throw new Error(`Multiple speaker-note relationships: ${path}`);
      const match = noteLinks[0]?.getAttribute("Target")?.match(/(?:^|\/)notesSlide([1-9]\d*)\.xml$/u);
      if (!match) continue;
      const notesPath = `ppt/notesSlides/notesSlide${match[1]}.xml`;
      if (!notesPaths.has(notesPath)) throw new Error(`Missing speaker notes for ${path}`);
      notesForSlide.set(path, notesPath);
      mappedNotes.add(notesPath);
    }
    if (mappedNotes.size !== notesPaths.size) {
      throw new Error("Some PowerPoint speaker notes could not be mapped to a slide; complete extraction is unavailable.");
    }
  }

  for (const path of paths) {
    const slideNumber = format === "pptx" && options.complete
      ? paths.indexOf(path) + 1
      : Number(path.match(/slide(\d+)\.xml$/u)?.[1]);
    const mainText = xmlText(await readXml(path, true), format === "docx" ? "word" : "slide").trim();
    const notesXml = format === "pptx"
      ? await readXml(options.complete ? notesForSlide.get(path) ?? "" : `ppt/notesSlides/notesSlide${slideNumber}.xml`, false)
      : "";
    const notes = notesXml ? xmlText(notesXml, "slide").trim() : "";
    const text = [mainText, notes ? `Speaker notes:\n${notes}` : ""].filter(Boolean).join("\n");
    if (text || options.complete) parts.push({ part: format === "docx" ? paths.indexOf(path) + 1 : slideNumber,
      ...(options.complete ? { section: format === "docx" ? path : `slide ${slideNumber}` } : {}), text });
  }
  if (!parts.length) throw new Error("This Office file contains no extractable text. Images are not analyzed yet.");
  return parts;
}
