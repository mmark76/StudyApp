import { describe, expect, it, vi } from "vitest";
import type { LocalStudyFile } from "../src/shared/types/models";
import { DEFAULT_SUMMARY_LIMITS, generateCompleteSummary, prepareCompleteSummary, splitCompleteText } from "../src/features/summary/fullDocumentSummary";
import { coverageReport } from "../src/features/assistant/AiCapabilitiesLimits";

function textFile(id: string, value: string): LocalStudyFile {
  const data = new Blob([value], { type: "text/plain" });
  return { id, title: id, fileName: `${id}.txt`, size: data.size, createdAt: "2026-11-03", data,
    mimeType: "text/plain", fileKind: "text", fileSource: "source-material" };
}

describe("complete document summary", () => {
  it("partitions without losing beginning, middle, end or surrogate pairs", () => {
    const source = `${"a".repeat(4_000)}😀${"b".repeat(4_000)}`;
    expect(splitCompleteText(source, 4_000).join("")).toBe(source);
    expect(splitCompleteText(source, 4_000).every((part) => !part.endsWith("\uD83D"))).toBe(true);
  });

  it("enforces configurable per-file and combined job sizes before extraction", async () => {
    expect(DEFAULT_SUMMARY_LIMITS.maxFileBytes).toBe(50_000_000);
    expect(DEFAULT_SUMMARY_LIMITS.maxJobBytes).toBe(50_000_000);
    const limits = { ...DEFAULT_SUMMARY_LIMITS, maxFileBytes: 10, maxJobBytes: 16 };
    await expect(prepareCompleteSummary([{ kind: "file", file: textFile("large", "x".repeat(11)) }], undefined, limits)).rejects.toThrow("file limit");
    await expect(prepareCompleteSummary([
      { kind: "file", file: textFile("one", "x".repeat(9)) },
      { kind: "file", file: textFile("two", "y".repeat(9)) },
    ], undefined, limits)).rejects.toThrow("job limit");
  });

  it("processes every chunk across two documents and hierarchically retains beginning, middle and end", async () => {
    const first = `${"study text ".repeat(1_200)}BEGIN ${"study text ".repeat(1_200)}MIDDLE`;
    const second = `${"other text ".repeat(1_200)}END`;
    const job = await prepareCompleteSummary([
      { kind: "file", file: textFile("first", first) },
      { kind: "file", file: textFile("second", second) },
    ]);
    expect(job.complete).toBe(true);
    expect(job.chunks.length).toBeGreaterThan(6);
    expect(job.chunks.filter((part) => part.sourceId === "S1").map((part) => part.text).join("")).toBe(first);
    expect(job.chunks.filter((part) => part.sourceId === "S2").map((part) => part.text).join("")).toBe(second);
    expect(job.coverage.map((item) => item.chunks).reduce((total, count) => total + count, 0)).toBe(job.chunks.length);

    const sent: string[] = [];
    const request = vi.fn(async (phase: "extract" | "combine", parts: readonly { text: string; citation: string }[]) => {
      if (phase === "extract") sent.push(parts[0].text);
      const joined = parts.map((part) => part.text).join(" ");
      const markers = ["BEGIN", "MIDDLE", "END"].filter((marker) => joined.includes(marker)).join(" ") || "study content";
      const citation = phase === "extract" ? parts[0].citation : joined.includes("[S2]") ? "[S2]" : "[S1]";
      return JSON.stringify({ summary: `${markers} ${citation}`, mainPoints: [`${markers} ${citation}`] });
    });
    const result = await generateCompleteSummary(job, request);
    expect(sent).toEqual(job.chunks.map((part) => part.text));
    expect(request.mock.calls.filter(([phase]) => phase === "combine").length).toBeGreaterThan(0);
    expect(result.summary).toContain("BEGIN");
    expect(result.summary).toContain("MIDDLE");
    expect(result.summary).toContain("END");
  });

  it("reports missing readable coverage and sends no partial document", async () => {
    const job = await prepareCompleteSummary([
      { kind: "file", file: textFile("readable", "Readable content") },
      { kind: "file", file: textFile("image-only", " \n\n ") },
    ]);
    expect(job.complete).toBe(false);
    expect(job.coverage).toContainEqual(expect.objectContaining({ documentTitle: "image-only", status: "no-text", chunks: 0 }));
    expect(coverageReport(job, null)).toMatchObject({ verified: false, total: 2, readable: 1, failed: 1, processed: 0 });
    const request = vi.fn();
    await expect(generateCompleteSummary(job, request)).rejects.toThrow("Review incomplete coverage");
    expect(request).not.toHaveBeenCalled();
  });

  it("reports verified extraction separately from actual processing progress", async () => {
    const job = await prepareCompleteSummary([{ kind: "file", file: textFile("complete", "study ".repeat(2_000)) }]);
    expect(job.chunks.length).toBeGreaterThan(1);
    expect(coverageReport(job, null)).toMatchObject({ verified: true, processed: 0, failed: 0 });
    expect(coverageReport(job, { phase: "summarize", completed: 1, total: job.chunks.length }).processed).toBe(1);
    expect(coverageReport(job, { phase: "combine", completed: 1, total: 1 }).processed).toBe(job.chunks.length);
  });

  it("splits a chunk again when the selected model reports a smaller context window", async () => {
    const source = "learn ".repeat(900);
    const job = await prepareCompleteSummary([{ kind: "file", file: textFile("context", source) }]);
    const accepted: string[] = [];
    const request = vi.fn(async (phase: "extract" | "combine", parts: readonly { text: string; citation: string }[]) => {
      if (phase === "extract" && parts[0].text.length > 2_000) throw new Error("The selected ChatGPT model's context window was exceeded.");
      if (phase === "extract") accepted.push(parts[0].text);
      return JSON.stringify({ summary: `Content [S1]`, mainPoints: ["Content [S1]"] });
    });
    await generateCompleteSummary(job, request);
    expect(accepted.join("")).toBe(source);
    expect(accepted.length).toBeGreaterThan(job.chunks.length);
  });

  it("rejects duplicate sources and never publishes an interrupted partial summary", async () => {
    const file = textFile("same", "research ".repeat(1_000));
    await expect(prepareCompleteSummary([{ kind: "file", file }, { kind: "file", file }])).rejects.toThrow("selected more than once");
    const job = await prepareCompleteSummary([{ kind: "file", file }]);
    let calls = 0;
    const request = vi.fn(async () => {
      calls += 1;
      if (calls === 2) throw new Error("network interrupted");
      return JSON.stringify({ summary: "Research [S1]", mainPoints: ["Research [S1]"] });
    });
    await expect(generateCompleteSummary(job, request)).rejects.toThrow("network interrupted");
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("stops before a request when the user cancels the job", async () => {
    const job = await prepareCompleteSummary([{ kind: "file", file: textFile("cancel", "content ".repeat(1_000)) }]);
    const controller = new AbortController();
    const request = vi.fn(async () => {
      controller.abort();
      return JSON.stringify({ summary: "Content [S1]", mainPoints: ["Content [S1]"] });
    });
    await expect(generateCompleteSummary(job, request, undefined, DEFAULT_SUMMARY_LIMITS, controller.signal)).rejects.toThrow();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("reports every undecodable text source without sending a partial result", async () => {
    const data = new Blob([new Uint8Array([0xff, 0x61])], { type: "text/plain" });
    const invalid = { ...textFile("invalid", "placeholder"), data, size: data.size };
    const job = await prepareCompleteSummary([{ kind: "file", file: invalid }]);
    expect(job.complete).toBe(false);
    expect(job.coverage).toEqual([expect.objectContaining({ status: "failed", section: "document text", chunks: 0 })]);
    expect(job.chunks).toHaveLength(0);
  });

  it("reduces intermediate summaries again when a model rejects a combine request", async () => {
    const job = await prepareCompleteSummary([{ kind: "file", file: textFile("reduce", "topic ".repeat(3_000)) }]);
    let contextRejections = 0;
    const request = vi.fn(async (phase: "extract" | "combine", parts: readonly { text: string }[]) => {
      if (phase === "extract") return JSON.stringify({ summary: `${"detail ".repeat(150)}[S1]`, mainPoints: ["Detail [S1]"] });
      if (parts.length > 1 && parts.map((part) => part.text.length).reduce((a, b) => a + b, 0) > 500) {
        contextRejections += 1;
        throw new Error("The selected ChatGPT model's context window was exceeded.");
      }
      return JSON.stringify({ summary: "Condensed [S1]", mainPoints: ["Condensed [S1]"] });
    });
    await expect(generateCompleteSummary(job, request)).resolves.toMatchObject({ summary: "Condensed [S1]" });
    expect(contextRejections).toBeGreaterThan(0);
  });
});
