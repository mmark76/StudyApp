import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import type { AppSetting, CardProgress, LocalStudyFile, StudyOperation, StudySession } from "../../shared/types/models";

export interface ArchiveChoice { files: string[]; progress: boolean; settings: boolean }
interface ArchivedFile { metadata: Omit<LocalStudyFile, "data">; base64: string }
export interface Archive {
  format: "studyapp-selective-archive";
  version: 1;
  createdAt: string;
  files: ArchivedFile[];
  progress?: { cards: CardProgress[]; sessions: StudySession[]; operations: StudyOperation[] };
  settings?: AppSetting[];
}
type Picker = (options: { suggestedName: string; types: { description: string; accept: Record<string,string[]> }[] }) => Promise<{
  createWritable(): Promise<{ write(data: Blob): Promise<void>; close(): Promise<void>; abort(): Promise<void> }>;
  getFile(): Promise<File>;
}>;
const MAX_TOTAL_BYTES = 180 * 1024 * 1024;

function bufferToBase64(buffer: ArrayBuffer): string {
  const data = new Uint8Array(buffer); let value = "";
  for (let i = 0; i < data.length; i += 16384) {
    value += String.fromCharCode(...data.subarray(i, i + 16384));
  }
  return btoa(value);
}
function base64ToBlob(base64: string, mimeType: string): Blob {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) throw new Error("Invalid archive encoding");
  const binary = atob(base64); const parts: Uint8Array[] = [];
  for (let i = 0; i < binary.length; i += 16384) {
    const chunk = new Uint8Array(binary.slice(i, i + 16384).split("").map(c => c.charCodeAt(0)));
    parts.push(chunk);
  }
  return new Blob(parts.map(part => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer), { type: mimeType });
}
async function digest(blob: Blob): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(hash), b=>b.toString(16).padStart(2,"0")).join("");
}
function asArray<T>(x: unknown): T[] { if (!Array.isArray(x)) throw new Error("Invalid archive array"); return x as T[]; }
export function parseArchive(value: unknown): Archive {
  if (!value || typeof value !== "object") throw new Error("Invalid archive");
  const a = value as Archive;
  if (a.format !== "studyapp-selective-archive" || a.version !== 1 || !Number.isFinite(Date.parse(a.createdAt))) throw new Error("Unsupported archive");
  asArray<ArchivedFile>(a.files);
  if (a.progress) { asArray(a.progress.cards); asArray(a.progress.sessions); asArray(a.progress.operations); }
  if (a.settings) asArray<AppSetting>(a.settings);
  for (const f of a.files) {
    if (!f || !f.metadata || typeof f.metadata.id !== "string" || typeof f.metadata.fileName !== "string" || typeof f.base64 !== "string" || f.base64.length > MAX_TOTAL_BYTES * 1.4) throw new Error("Invalid archived file");
  }
  if (new Set(a.files.map(f=>f.metadata.id)).size !== a.files.length) throw new Error("Repeated file IDs");
  return a;
}
export async function createArchive(choice: ArchiveChoice): Promise<Archive> {
  if (!choice.files.length && !choice.progress && !choice.settings) throw new Error("Select something first");
  const data = await studyDatabase.transaction("r", studyDatabase.studyFiles,studyDatabase.cardProgress,studyDatabase.studySessions,studyDatabase.studyOperations,studyDatabase.settings,async()=>{
    const files = await studyDatabase.studyFiles.bulkGet(choice.files);
    if(files.some(f=>!f)) throw new Error("Files changed; select again");
    const progress = choice.progress ? { cards:await studyDatabase.cardProgress.toArray(), sessions:await studyDatabase.studySessions.toArray(), operations:await studyDatabase.studyOperations.toArray() }:undefined;
    const settings = choice.settings ? await studyDatabase.settings.toArray():undefined;
    return { files: files as LocalStudyFile[],progress,settings };
  });
  const bytes=data.files.reduce((sum,f)=>sum+f.data.size,0);
  if(bytes>MAX_TOTAL_BYTES)throw new Error("Maximum archive size is 180 MB; select fewer files");
  const files:ArchivedFile[]=[];
  for(const f of data.files){ const {data:blob,...metadata}=f; files.push({metadata:{...metadata,contentHash:await digest(blob)},base64:bufferToBase64(await blob.arrayBuffer())}); }
  return {format:"studyapp-selective-archive",version:1,createdAt:new Date().toISOString(),files, ...(data.progress?{progress:data.progress}:{}), ...(data.settings?{settings:data.settings}:{})};
}
export async function verifyArchive(a:Archive):Promise<void>{
  parseArchive(a);
  let total=0;
  for(const entry of a.files){
    const blob=base64ToBlob(entry.base64,entry.metadata.mimeType||"application/octet-stream");
    total+=blob.size;
    if(total>MAX_TOTAL_BYTES || blob.size!==entry.metadata.size) throw new Error("File size mismatch");
    if(entry.metadata.contentHash && await digest(blob)!==entry.metadata.contentHash)throw new Error("File checksum mismatch");
  }
}
function fingerprint(a:Archive):string { return JSON.stringify(a); }
export async function archiveToDisk(choice:ArchiveChoice, deleteAfterSave:boolean, confirmDeletion:()=>boolean):Promise<"saved"|"deleted">{
  const picker=(window as Window & {showSaveFilePicker?:Picker}).showSaveFilePicker;
  if(!picker)throw new Error("Verified save requires a browser with File System Access support; nothing was removed");
  if(deleteAfterSave && choice.settings && !choice.progress && await studyDatabase.cardProgress.count())throw new Error("Include progress before removing settings; nothing was deleted");
  const archive=await createArchive(choice);
  await verifyArchive(archive);
  const serialized=JSON.stringify(archive);
  const blob=new Blob([serialized],{type:"application/json"});
  const name="studyapp-archive-"+new Date().toISOString().replace(/[:.]/g,"-")+".json";
  const handle=await picker({suggestedName:name,types:[{description:"StudyApp archive",accept:{"application/json":[".json"]}}]});
  const writer=await handle.createWritable();
  try { await writer.write(blob); await writer.close(); } catch(e){try{await writer.abort();}catch{} throw e;}
  const saved=await handle.getFile();
  if(saved.size!==blob.size || await digest(saved)!==await digest(blob)) throw new Error("Saved file could not be verified. Nothing was deleted");
  if(!deleteAfterSave || !confirmDeletion())return "saved";
  // Re-snapshot before removal, so a concurrent edit cannot be silently lost.
  const latest=await createArchive(choice);
  if(fingerprint({...latest,createdAt:archive.createdAt})!==fingerprint(archive)) throw new Error("Browser data changed after export. File saved, nothing deleted");
  await studyDatabase.transaction("rw",studyDatabase.studyFiles,studyDatabase.cardProgress,studyDatabase.studySessions,studyDatabase.studyOperations,studyDatabase.settings,async()=>{
    for(const id of choice.files)if(!(await studyDatabase.studyFiles.get(id)))throw new Error("Selected data was changed before deletion");
    if(choice.files.length)await studyDatabase.studyFiles.bulkDelete(choice.files);
    if(choice.progress){await studyDatabase.cardProgress.clear();await studyDatabase.studyOperations.clear();await studyDatabase.studySessions.clear();}
    if(choice.settings)await studyDatabase.settings.clear();
  });
  return "deleted";
}
export async function restoreArchive(archive:Archive):Promise<void>{
  await verifyArchive(archive);
  const fileRecords=archive.files.map(f=>({...f.metadata,data:base64ToBlob(f.base64,f.metadata.mimeType||"application/octet-stream")}));
  await studyDatabase.transaction("rw",studyDatabase.studyFiles,studyDatabase.cardProgress,studyDatabase.studySessions,studyDatabase.studyOperations,studyDatabase.settings,async()=>{
    const existing=await studyDatabase.studyFiles.bulkGet(fileRecords.map(f=>f.id));
    if(existing.some(Boolean))throw new Error("Restore stopped: a file ID already exists");
    if(archive.progress && (await studyDatabase.cardProgress.count()||await studyDatabase.studySessions.count()||await studyDatabase.studyOperations.count()))throw new Error("Restore stopped: progress already exists");
    if(archive.settings && (await studyDatabase.settings.count())) throw new Error("Restore stopped: settings already exist");
    if(fileRecords.length)await studyDatabase.studyFiles.bulkAdd(fileRecords);
    if(archive.progress){await studyDatabase.cardProgress.bulkAdd(archive.progress.cards);await studyDatabase.studySessions.bulkAdd(archive.progress.sessions);await studyDatabase.studyOperations.bulkAdd(archive.progress.operations);}
    if(archive.settings)await studyDatabase.settings.bulkAdd(archive.settings);
  });
}
