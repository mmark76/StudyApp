import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { studyDatabase } from "../src/infrastructure/database/studyDatabase";
import { deleteWorkspaceMaterial, listWorkspaceMaterial } from "../src/features/workspace-beta/workspaceMaterialService";

beforeEach(async()=>{
  await studyDatabase.open();
  await studyDatabase.transaction("rw",studyDatabase.studyFiles,studyDatabase.settings,studyDatabase.cardProgress,studyDatabase.studySessions,studyDatabase.studyOperations,async()=>{
    await studyDatabase.studyFiles.clear();await studyDatabase.settings.clear();await studyDatabase.cardProgress.clear();await studyDatabase.studySessions.clear();await studyDatabase.studyOperations.clear();
  });
});
describe("Workspace shared material management",()=>{
  it("deletes selected source file without touching another file or history",async()=>{
    const now=new Date().toISOString();
    await studyDatabase.studyFiles.bulkAdd([
      {id:"source",title:"Book",fileName:"book.pdf",size:1,createdAt:now,fileSource:"source-material",data:new Blob(["x"])},
      {id:"structure",title:"Note",fileName:"note.txt",size:1,createdAt:now,fileSource:"structured-material",structuredStudyType:"chapter",data:new Blob(["y"])},
    ]);
    await studyDatabase.cardProgress.put({cardId:"card",score:1,repetitions:1,intervalDays:1,nextReviewAt:now,lastReviewedAt:now,lapses:0});
    expect((await listWorkspaceMaterial("sources")).map(x=>x.key)).toEqual(["file:source"]);
    await deleteWorkspaceMaterial("sources",["file:source"]);
    expect(await studyDatabase.studyFiles.get("source")).toBeUndefined();
    expect(await studyDatabase.studyFiles.get("structure")).toBeDefined();
    expect(await studyDatabase.cardProgress.count()).toBe(1);
  });
  it("removes a chapter and linked active flashcards, preserving saved progress",async()=>{
    const now=new Date().toISOString();
    const chapter={id:"chapter",number:1,title:"Intro",objectives:[],summary:[],keyTerms:[]};
    await studyDatabase.settings.bulkPut([
      {key:"imported-study-units",value:[chapter]},
      {key:"imported-flashcards",value:[{id:"card",unitId:"chapter",number:1,question:"Q",answer:"A",tags:[]}]},
    ]);
    await studyDatabase.cardProgress.put({cardId:"card",score:1,repetitions:1,intervalDays:1,nextReviewAt:now,lastReviewedAt:now,lapses:0});
    expect((await listWorkspaceMaterial("knowledge")).some(x=>x.key==="unit:chapter")).toBe(true);
    await deleteWorkspaceMaterial("knowledge",["unit:chapter"]);
    expect((await studyDatabase.settings.get("imported-study-units"))?.value).toEqual([]);
    expect((await studyDatabase.settings.get("imported-flashcards"))?.value).toEqual([]);
    expect(await studyDatabase.cardProgress.count()).toBe(1);
  });
  it("rejects invalid scope and stale Delete All without deleting anything",async()=>{
    const now=new Date().toISOString();
    await studyDatabase.studyFiles.add({id:"source",title:"Book",fileName:"book.txt",size:1,createdAt:now,data:new Blob(["x"])});
    await expect(deleteWorkspaceMaterial("ai",["file:source"])).rejects.toThrow();
    await expect(deleteWorkspaceMaterial("sources",["file:source","file:missing"],true)).rejects.toThrow();
    expect(await studyDatabase.studyFiles.count()).toBe(1);
  });
});
