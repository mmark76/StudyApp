import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addSavedStudyMaterialLink,
  removeSavedStudyMaterialLink,
} from "../src/features/study-materials/studyMaterialLinksRepository";
import {
  parseStoredStudyMaterials,
  STUDY_MATERIALS_SETTING_KEY,
  type StudyMaterialLink,
} from "../src/features/study-materials/studyMaterials";
import {
  exportBackup,
  serializeBackup,
} from "../src/infrastructure/backup/backup";
import { StudyDatabase } from "../src/infrastructure/database/studyDatabase";

const firstLink: StudyMaterialLink = {
  id: "link-1",
  title: "First",
  url: "https://example.com/first",
  materialType: "book",
};
const secondLink: StudyMaterialLink = {
  id: "link-2",
  title: "Second",
  url: "https://example.com/second",
  structuredStudyType: "chapter",
};

describe("saved study material links", () => {
  let database: StudyDatabase;

  beforeEach(async () => {
    database = new StudyDatabase(`study-links-${crypto.randomUUID()}`);
    await database.open();
  });

  afterEach(async () => {
    await database.delete();
  });

  async function storedLinks(): Promise<StudyMaterialLink[]> {
    const setting = await database.settings.get(STUDY_MATERIALS_SETTING_KEY);
    return parseStoredStudyMaterials(setting?.value);
  }

  async function serializeCurrentBackup(): Promise<string> {
    return serializeBackup(await exportBackup(database));
  }

  it("canonicalizes own undefined optional properties to absence", () => {
    const links = parseStoredStudyMaterials([
      { ...firstLink, structuredStudyType: undefined },
      { ...secondLink, materialType: undefined },
    ]);

    expect(links).toEqual([firstLink, secondLink]);
    expect(Object.hasOwn(links[0], "structuredStudyType")).toBe(false);
    expect(Object.hasOwn(links[1], "materialType")).toBe(false);
  });

  it.each([
    ["Library", firstLink, "structuredStudyType"],
    ["Structured Study", secondLink, "materialType"],
  ] as const)(
    "exports and serializes one current UI-style %s link",
    async (_label, link, absentProperty) => {
      await addSavedStudyMaterialLink(link, database);

      const serialized = await serializeCurrentBackup();
      const [storedLink] = await storedLinks();

      expect(storedLink).toEqual(link);
      expect(Object.hasOwn(storedLink, absentProperty)).toBe(false);
      expect(serialized).not.toContain(`"${absentProperty}"`);
    },
  );

  it("keeps every add and remove state exportable and canonical", async () => {
    await addSavedStudyMaterialLink(firstLink, database);
    await expect(serializeCurrentBackup()).resolves.toContain('"materialType": "book"');

    await addSavedStudyMaterialLink(secondLink, database);
    await expect(serializeCurrentBackup()).resolves.toContain(
      '"structuredStudyType": "chapter"',
    );

    const afterSecondAdd = await storedLinks();
    expect(Object.hasOwn(afterSecondAdd[0], "structuredStudyType")).toBe(false);
    expect(Object.hasOwn(afterSecondAdd[1], "materialType")).toBe(false);

    await removeSavedStudyMaterialLink(firstLink.id, database);

    await expect(storedLinks()).resolves.toEqual([secondLink]);
    await expect(serializeCurrentBackup()).resolves.not.toContain('"materialType"');
  });

  it("serializes concurrent additions without losing either link", async () => {
    await Promise.all([
      addSavedStudyMaterialLink(firstLink, database),
      addSavedStudyMaterialLink(secondLink, database),
    ]);

    await expect(storedLinks()).resolves.toEqual([firstLink, secondLink]);
  });

  it("removes a link transactionally", async () => {
    await addSavedStudyMaterialLink(firstLink, database);
    await addSavedStudyMaterialLink(secondLink, database);

    await removeSavedStudyMaterialLink(firstLink.id, database);

    await expect(storedLinks()).resolves.toEqual([secondLink]);
  });

  it("rejects corrupt stored links without overwriting them", async () => {
    const corruptValue = [{ id: "broken", title: "Broken" }];
    await database.settings.put({
      key: STUDY_MATERIALS_SETTING_KEY,
      value: corruptValue,
    });

    await expect(addSavedStudyMaterialLink(firstLink, database)).rejects.toThrow(
      "saved link is invalid",
    );
    await expect(database.settings.get(STUDY_MATERIALS_SETTING_KEY)).resolves.toEqual({
      key: STUDY_MATERIALS_SETTING_KEY,
      value: corruptValue,
    });
  });
});
