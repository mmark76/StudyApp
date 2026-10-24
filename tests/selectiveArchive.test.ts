import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { studyDatabase } from "../src/infrastructure/database/studyDatabase";
import { archiveToDisk, createArchive, parseArchive, restoreArchive, verifyArchive } from "../src/features/archive/archiveService";

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
    await studyDatabase.settings.put({key:"study-material-links",value:[]});
    const writer={write:vi.fn(async()=>{}),close:vi.fn(async()=>{}),abort:vi.fn(async()=>{})};
    vi.stubGlobal("window",{showSaveFilePicker:async()=>({createWritable:async()=>writer,getFile:async()=>new File(["corrupted"],"archive.json")})});
    await expect(archiveToDisk({files:[],progress:false,settings:true},true,()=>true)).rejects.toThrow("verified");
    expect(await studyDatabase.settings.count()).toBe(1);
    expect(writer.close).toHaveBeenCalledOnce();
  });
  it("rejects files with missing or corrupted mandatory checksums",async()=>{
    await studyDatabase.studyFiles.add({id:"one",title:"One",fileName:"one.txt",size:3,createdAt:new Date().toISOString(),data:new Blob(["one"])});
    const archive=await createArchive({files:["one"],progress:false,settings:false});
    const missing=structuredClone(archive);
    delete (missing.files[0].metadata as {contentHash?:string}).contentHash;
    await expect(verifyArchive(missing)).rejects.toThrow("Invalid archived file");
    const changed=structuredClone(archive);
    changed.files[0].base64=btoa("two");
    await expect(verifyArchive(changed)).rejects.toThrow("checksum");
  });
  it("blocks deletion when settings change after saving and confirmation",async()=>{
    await studyDatabase.settings.put({key:"study-material-links",value:[]});
    let serialized="";
    const writer={
      write:vi.fn(async(blob:Blob)=>{serialized=await blob.text();}),
      close:vi.fn(async()=>{}),
      abort:vi.fn(async()=>{})
    };
    vi.stubGlobal("window",{showSaveFilePicker:async()=>({
      createWritable:async()=>writer,
      getFile:async()=>new File([serialized],"archive.json")
    })});
    await expect(archiveToDisk({files:[],progress:false,settings:true},true,()=>{
      void studyDatabase.settings.put({key:"study-material-links",value:[{id:"new-link",title:"Link",url:"https://example.com"}]});
      return true;
    })).rejects.toThrow();
    expect(await studyDatabase.settings.count()).toBe(1);
  });
  it("deletes an unchanged selected file only after verified disk save",async()=>{
    await studyDatabase.studyFiles.add({id:"target",title:"Target",fileName:"target.txt",size:6,createdAt:new Date().toISOString(),data:new Blob(["target"])});
    await studyDatabase.studyFiles.add({id:"kept",title:"Kept",fileName:"kept.txt",size:4,createdAt:new Date().toISOString(),data:new Blob(["kept"])});
    let bytes="";
    const writer={write:vi.fn(async(blob:Blob)=>{bytes=await blob.text();}),close:vi.fn(async()=>{}),abort:vi.fn(async()=>{})};
    vi.stubGlobal("window",{showSaveFilePicker:async()=>({createWritable:async()=>writer,getFile:async()=>new File([bytes],"archive.json")})});
    await expect(archiveToDisk({files:["target"],progress:false,settings:false},true,()=>true)).resolves.toBe("deleted");
    expect(await studyDatabase.studyFiles.get("target")).toBeUndefined();
    expect((await studyDatabase.studyFiles.get("kept"))?.id).toBe("kept");
  });
  it("rejects malformed progress and unrecognized settings before restore",async()=>{
    const base={format:"studyapp-selective-archive",version:1,createdAt:new Date().toISOString(),files:[]};
    expect(()=>parseArchive({...base,progress:{cards:[{cardId:"x",score:999}],sessions:[],operations:[]}})).toThrow();
    expect(()=>parseArchive({...base,settings:[{key:"unrecognized",value:"unsafe"}]})).toThrow();
    expect(await studyDatabase.cardProgress.count()).toBe(0);
  });

});
