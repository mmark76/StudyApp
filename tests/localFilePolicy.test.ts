import { describe, expect, it } from "vitest";
import {
  LocalFilePolicyError,
  validateLocalStudyFile,
  validateStoredLocalStudyFile,
} from "../src/features/study-materials/localFilePolicy";
import type { LocalStudyFile } from "../src/shared/types/models";

function makeFile(
  name: string,
  bytes: BlobPart,
  type = "",
): File {
  return new File([bytes], name, { type });
}

const validFiles = [
  {
    name: "paper.pdf",
    type: "application/pdf",
    bytes: "%PDF-1.7\n%%EOF",
    format: "pdf",
    openMode: "preview",
  },
  {
    name: "notes.doc",
    type: "application/msword",
    bytes: new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
    format: "doc",
    openMode: "download",
  },
  {
    name: "notes.docx",
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    bytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    format: "docx",
    openMode: "download",
  },
  {
    name: "notes.txt",
    type: "text/plain",
    bytes: "Plain study notes",
    format: "txt",
    openMode: "preview",
  },
  {
    name: "notes.md",
    type: "text/markdown",
    bytes: "# Study notes",
    format: "markdown",
    openMode: "preview",
  },
  {
    name: "cards.csv",
    type: "text/csv",
    bytes: "Question,Answer\nOne,Two",
    format: "csv",
    openMode: "preview",
  },
  {
    name: "diagram.png",
    type: "image/png",
    bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    format: "png",
    openMode: "preview",
  },
  {
    name: "photo.jpeg",
    type: "image/jpeg",
    bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xdb]),
    format: "jpeg",
    openMode: "preview",
  },
  {
    name: "chart.webp",
    type: "image/webp",
    bytes: new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]),
    format: "webp",
    openMode: "preview",
  },
  {
    name: "animation.gif",
    type: "image/gif",
    bytes: "GIF89a",
    format: "gif",
    openMode: "preview",
  },
] as const;

describe("local file policy", () => {
  it.each(validFiles)("accepts $name with its expected safe handling", async ({
    name,
    type,
    bytes,
    format,
    openMode,
  }) => {
    const result = await validateLocalStudyFile(makeFile(name, bytes, type));

    expect(result.format).toBe(format);
    expect(result.openMode).toBe(openMode);
  });

  it("accepts an empty browser MIME type when the extension and signature are valid", async () => {
    const result = await validateLocalStudyFile(makeFile("paper.pdf", "%PDF-1.7", ""));

    expect(result).toMatchObject({
      format: "pdf",
      canonicalMimeType: "application/pdf",
      openMode: "preview",
    });
  });

  it.each([
    ["page.html", "<!doctype html><script>alert(1)</script>", "text/html"],
    ["page.xhtml", "<html><script>alert(1)</script></html>", "application/xhtml+xml"],
    ["diagram.svg", "<svg onload=\"alert(1)\"></svg>", "image/svg+xml"],
    ["data.xml", "<?xml version=\"1.0\"?><data />", "application/xml"],
    ["payload.js", "alert(1)", "text/javascript"],
  ])("rejects active web content: %s", async (name, contents, type) => {
    await expect(validateLocalStudyFile(makeFile(name, contents, type))).rejects.toBeInstanceOf(
      LocalFilePolicyError,
    );
  });

  it.each([
    ["renamed-html.txt", "<!doctype html><script>alert(1)</script>"],
    ["renamed-svg.md", "<svg onload=\"alert(1)\"></svg>"],
    ["renamed-xml.csv", "<?xml version=\"1.0\"?><data />"],
  ])("rejects active content hidden behind a safe text extension: %s", async (name, contents) => {
    await expect(validateLocalStudyFile(makeFile(name, contents))).rejects.toThrow(
      "appears to contain HTML, SVG, or XML",
    );
  });

  it("rejects a renamed HTML file whose extension claims it is a PDF", async () => {
    await expect(
      validateLocalStudyFile(makeFile("renamed-html.pdf", "<!doctype html><script>alert(1)</script>")),
    ).rejects.toThrow("do not match a PDF file");
  });

  it("rejects a significant extension and MIME conflict", async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    await expect(
      validateLocalStudyFile(makeFile("photo.png", pngBytes, "image/jpeg")),
    ).rejects.toThrow("extension and detected browser type do not match");
  });

  it("rejects executable content even when it is renamed as text", async () => {
    await expect(
      validateLocalStudyFile(makeFile("renamed-program.txt", new Uint8Array([0x4d, 0x5a]))),
    ).rejects.toThrow("Executable files cannot be stored");
  });

  it("revalidates legacy stored blobs before opening them", async () => {
    const unsafeFile: LocalStudyFile = {
      id: "legacy-file",
      title: "Legacy notes",
      fileName: "legacy-notes.txt",
      size: 44,
      createdAt: "2026-01-01T00:00:00.000Z",
      data: new Blob(["<html><script>alert(1)</script></html>"], { type: "text/html" }),
      mimeType: "text/html",
      fileKind: "text",
    };

    await expect(validateStoredLocalStudyFile(unsafeFile)).rejects.toBeInstanceOf(
      LocalFilePolicyError,
    );
  });
});
