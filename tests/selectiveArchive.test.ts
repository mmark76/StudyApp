import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { studyDatabase } from "../src/infrastructure/database/studyDatabase";
import { archiveToDisk, createArchive, restoreArchive, verifyArchive } from "../src/features/archive/archiveService";

beforeEach(async()=>{await studyDatabase.open();await studyDatabase.transaction("rw",studyDatabase.studyFiles,studyDatabase.settings,studyDatabase.cardProgress,studyDatabase.studyOperations,studyDatabase.studySessions,async()=>{await Promise.all([studyDatabase.studyFiles.clear(),studyDatabase.settings.clear(),studyDatabase.cardProgress.clear(),studyDatabase.studyOperations.clear(),studyDatabase.studySessions.clear()]);});});
afterEach(()=>{vi.unstubAllGlobals();});
describe("selective archive safety",()=>{
  it("exports only selected file bytes and restores without overwriting",async()=>{
    await studyDatabase.studyFiles.bulkAdd([
      {id:"one",title:"One",fileName:"one.txt",size:3,createdAt:new Date().toISOString(),data:new Blob(["one"])},
      {id:"two",title:"Two",fileName:"two.txt",size:3,createdAt:new Date().toISOString(),data:new Blob(["two"])}
    ]);
    const a=await createArchive({files:["one"],progress:false,settings:false});
    expect(a.files).toHaveLength(1);expect(a.files[0].metadata.contentHash).toMatch(/^[a-f0-9]{64}$/);
    await verifyArchive(a);
    await expect(restoreArchive(a)).rejects.toThrow("already exists");
    expect(await studyDatabase.studyFiles.count()).toBe(2);
    await studyDatabase.studyFiles.delete("one");
    await restoreArchive(a);
    const restored=await studyDatabase.studyFiles.get("one");
    expect(await restored!.data.text()).toBe("one");
    expect(await studyDatabase.studyFiles.count()).toBe(2);
  });
  it("never deletes if saved file cannot be reread faithfully",async()=>{
    await studyDatabase.settings.put({key:"display",value:"value"});
    const writer={write:vi.fn(async()=>{}),close:vi.fn(async()=>{}),abort:vi.fn(async()=>{})};
    vi.stubGlobal("window",{showSaveFilePicker:async()=>({createWritable:async()=>writer,getFile:async()=>new File(["corrupted"],"archive.json")})});
    await expect(archiveToDisk({files:[],progress:false,settings:true},true,()=>true)).rejects.toThrow("verified");
    expect(await studyDatabase.settings.count()).toBe(1);
    expect(writer.close).toHaveBeenCalledOnce();
  });
});
