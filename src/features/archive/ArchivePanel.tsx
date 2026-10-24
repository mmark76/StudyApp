import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useLanguage } from "../../i18n/LanguageContext";
import { studyDatabase } from "../../infrastructure/database/studyDatabase";
import { archiveToDisk, parseArchive, restoreArchive, type ArchiveChoice } from "./archiveService";

export function ArchivePanel(){
  const {text}=useLanguage();
  const files=useLiveQuery(()=>studyDatabase.studyFiles.orderBy("createdAt").toArray(),[])??[];
  const [ids,setIds]=useState<string[]>([]);
  const [progress,setProgress]=useState(false);
  const [settings,setSettings]=useState(false);
  const [remove,setRemove]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const input=useRef<HTMLInputElement>(null);
  const picked=ids.filter(id=>files.some(f=>f.id===id));
  const choice:ArchiveChoice={files:picked,progress,settings};
  async function save(){
    if(busy)return;
    if(!picked.length&&!progress&&!settings){setMessage(text("Select data first.","Επίλεξε πρώτα δεδομένα."));return;}
    setBusy(true);setMessage("");
    try{
      const outcome=await archiveToDisk(choice,remove,()=>window.confirm(text(
        "The saved file has been checked. Permanently remove ONLY the selected browser data? Confirm you can access the file on your disk.",
        "Το αποθηκευμένο αρχείο ελέγχθηκε. Να διαγραφούν οριστικά ΜΟΝΟ τα επιλεγμένα δεδομένα από τον browser; Επιβεβαίωσε ότι έχεις πρόσβαση στο αρχείο στον δίσκο."
      )));
      setMessage(outcome==="deleted"?text("Archive verified; selected data removed.","Η αρχειοθέτηση επαληθεύτηκε και τα επιλεγμένα δεδομένα διαγράφηκαν."):text("Archive saved and verified. Browser data was kept.","Το αρχείο αποθηκεύτηκε και επαληθεύτηκε. Τα δεδομένα παρέμειναν στον browser."));
      if(outcome==="deleted"){setIds([]);setProgress(false);setSettings(false);}
    }catch(e){setMessage(e instanceof Error?e.message:text("Archive failed. Nothing deleted.","Η αρχειοθέτηση απέτυχε. Δεν διαγράφηκε τίποτα."));}
    finally{setBusy(false);}
  }
  async function restore(file:File|undefined){
    if(!file)return;
    setBusy(true);setMessage("");
    try{
      if(file.size>250*1024*1024)throw new Error("Archive is too large");
      const a=parseArchive(JSON.parse(await file.text()));
      if(!window.confirm(text(
        "Restore the selected archive? Existing records are never overwritten.",
        "Να γίνει επαναφορά του αρχείου; Τα υπάρχοντα δεδομένα δεν αντικαθίστανται."
      )))return;
      await restoreArchive(a);
      setMessage(text("Archive restored successfully.","Η επαναφορά ολοκληρώθηκε."));
    }catch(e){setMessage(e instanceof Error?e.message:text("Restore failed.","Αποτυχία επαναφοράς."));}
    finally{setBusy(false);if(input.current)input.current.value="";}
  }
  return <section className="content-panel stack-md" aria-labelledby="archive-title">
    <h3 id="archive-title">{text("Archive to hard disk","Αρχειοθέτηση στον δίσκο")}</h3>
    <p>{text("Choose exactly what to save. Deletion is optional and available only after the saved archive is re-opened and verified. Do not use this as your only backup.","Επίλεξε τι ακριβώς θα αποθηκευτεί. Η διαγραφή είναι προαιρετική και γίνεται μόνο μετά από επαλήθευση του αποθηκευμένου αρχείου. Διατήρησε και ανεξάρτητο αντίγραφο ασφαλείας.")}</p>
    <div className="stack-sm">
      <label><input type="checkbox" checked={progress} disabled={busy} onChange={e=>setProgress(e.target.checked)}/> {text("Study progress, sessions and operations","Πρόοδος, συνεδρίες και ενέργειες μελέτης")}</label>
      <label><input type="checkbox" checked={settings} disabled={busy||(!progress&&remove)} onChange={e=>setSettings(e.target.checked)}/> {text("Settings, imported chapters, flashcards and saved links","Ρυθμίσεις, εισαγόμενα κεφάλαια, κάρτες και σύνδεσμοι")}</label>
      <p>{text("Local files (including generated split PDFs):","Τοπικά αρχεία (μαζί με τα παραγόμενα PDF):")}</p>
      <div className="button-row"><button type="button" className="button secondary" disabled={busy} onClick={()=>setIds(files.map(f=>f.id))}>{text("Select all files","Επιλογή όλων")}</button><button type="button" className="button secondary" disabled={busy} onClick={()=>setIds([])}>{text("Clear selection","Καμία επιλογή")}</button></div>
      <div className="stack-sm" style={{maxHeight:220,overflowY:"auto"}}>
        {files.map(f=><label key={f.id}><input type="checkbox" disabled={busy} checked={picked.includes(f.id)} onChange={e=>setIds(s=>e.target.checked?[...s,f.id]:s.filter(id=>id!==f.id))}/> {f.title} ({Math.round(f.size/1024)} KB)</label>)}
        {!files.length?<p>{text("No local files.","Δεν υπάρχουν τοπικά αρχεία.")}</p>:null}
      </div>
      <label><input type="checkbox" disabled={busy} checked={remove} onChange={e=>{setRemove(e.target.checked);if(e.target.checked&&settings&&!progress)setProgress(true);}}/> {text("After verified saving, ask whether to remove selected data from this browser","Μετά την επαλήθευση, ζήτησε επιβεβαίωση για διαγραφή των επιλεγμένων δεδομένων από τον browser")}</label>
      {remove&&settings&&!progress?<p role="alert">{text("To remove settings safely, include progress as well.","Για ασφαλή διαγραφή ρυθμίσεων πρέπει να συμπεριληφθεί και η πρόοδος.")}</p>:null}
      <div className="button-row">
        <button className="button primary" type="button" disabled={busy|| (remove&&settings&&!progress)} onClick={()=>void save()}>{busy?text("Working…","Επεξεργασία…"):text("Save selected archive","Αποθήκευση επιλεγμένων")}</button>
        <button className="button secondary" type="button" disabled={busy} onClick={()=>input.current?.click()}>{text("Restore an archive","Επαναφορά αρχείου")}</button>
        <input ref={input} hidden type="file" accept=".json,application/json" onChange={e=>void restore(e.target.files?.[0])}/>
      </div>
    </div>
    <p className="inline-message" role="status" aria-live="polite">{message}</p>
  </section>;
}
