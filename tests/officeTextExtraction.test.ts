import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import { extractOfficeTextParts } from "../src/features/workspace-beta/officeTextExtraction";

beforeEach(() => vi.stubGlobal("DOMParser", DOMParser));
afterEach(() => vi.unstubAllGlobals());

async function archiveFile(entries: Record<string, string>): Promise<Blob> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(entries)) zip.file(path, content);
  const bytes = await zip.generateAsync({ type: "uint8array" });
  return new Blob([new Uint8Array(bytes)]);
}

describe("local Office document extraction", () => {
  it("extracts Word paragraphs and table cells without executing document content", async () => {
    const file = await archiveFile({
      "word/document.xml": `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
        <w:p><w:r><w:t>Decision making</w:t></w:r></w:p>
        <w:tbl><w:tr><w:tc><w:p><w:r><w:t>Evidence first</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
      </w:body></w:document>`,
    });
    await expect(extractOfficeTextParts(file, "docx")).resolves.toEqual([
      { part: 1, text: "Decision making\nEvidence first" },
    ]);
  });

  it("extracts PowerPoint text and speaker notes in numeric slide order", async () => {
    const slide = (value: string) => `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>${value}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;
    const file = await archiveFile({
      "ppt/slides/slide10.xml": slide("Conclusion"),
      "ppt/slides/slide2.xml": slide("Introduction"),
      "ppt/notesSlides/notesSlide2.xml": slide("Discuss alternatives"),
    });
    await expect(extractOfficeTextParts(file, "pptx")).resolves.toEqual([
      { part: 2, text: "Introduction\nSpeaker notes:\nDiscuss alternatives" },
      { part: 10, text: "Conclusion" },
    ]);
  });

  it("rejects renamed archives without Office content", async () => {
    const file = await archiveFile({ "other.xml": "<text>Wrong archive</text>" });
    await expect(extractOfficeTextParts(file, "docx")).rejects.toThrow("content is missing");
    await expect(extractOfficeTextParts(file, "pptx")).rejects.toThrow("No readable Office");
  });
});
