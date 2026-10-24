import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { deleteWorkspaceMaterial, listWorkspaceMaterial, type ManagedMaterialItem, type MaterialPanel } from "./workspaceMaterialService";
import "./WorkspaceMaterialManager.css";

interface Props { panel: MaterialPanel; onClose: () => void; }
export function WorkspaceMaterialManager({panel,onClose}: Props) {
  const {text}=useLanguage();
  const [items,setItems]=useState<ManagedMaterialItem[]>([]);
  const [selected,setSelected]=useState<string[]>([]);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const closeRef=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    let active=true;
    void listWorkspaceMaterial(panel).then(rows=>{if(active){setItems(rows);setLoading(false);}})
      .catch(()=>{if(active){setError(text("Stored material could not be read. Nothing was changed.","Δεν ήταν δυνατή η ανάγνωση. Δεν άλλαξε τίποτα."));setLoading(false);}});
    closeRef.current?.focus();
    return ()=>{active=false;};
  },[panel,text]);
  useEffect(()=>{
    function keyboard(event:KeyboardEvent){
      if(event.key==="Escape"&&!busy){event.preventDefault();onClose();}
    }
    window.addEventListener("keydown",keyboard);
    return ()=>window.removeEventListener("keydown",keyboard);
  },[busy,onClose]);
  async function remove(all:boolean){
    if(busy||loading||panel==="ai")return;
    const keys=all?items.map(item=>item.key):selected;
    if(!keys.length)return;
    const affectedChapters=panel==="knowledge"&&keys.some(key=>key.startsWith("unit:"));
    const warning=affectedChapters
      ? text("Removing chapters also removes linked flashcards from the active material. Study progress and history will be retained.","Η διαγραφή κεφαλαίων αφαιρεί και τις συνδεδεμένες flashcards από το ενεργό υλικό. Η πρόοδος και το ιστορικό διατηρούνται.")
      : text("Study progress and history will be retained.","Η πρόοδος και το ιστορικό διατηρούνται.");
    if(!window.confirm(text(`Delete ${keys.length} selected item(s)? `,"Να διαγραφούν "+keys.length+" επιλεγμένα στοιχεία; ")+warning))return;
    setBusy(true);setError("");
    try {
      await deleteWorkspaceMaterial(panel,keys,all);
      const refreshed=await listWorkspaceMaterial(panel);
      setItems(refreshed);setSelected([]);
      setError(text("Material removed. Progress was preserved.","Το υλικό διαγράφηκε. Η πρόοδος διατηρήθηκε."));
    } catch {
      setError(text("Material changed or could not be removed. Review again; no other material was modified.","Το υλικό άλλαξε ή δεν διαγράφηκε. Έλεγξε ξανά την επιλογή."));
    }finally{setBusy(false);}
  }
  const title=panel==="sources"?text("Sources & Materials","Πηγές & Υλικό"):panel==="knowledge"?text("Core Knowledge","Βασική Γνώση"):panel==="practice"?text("Practice & Mastery","Εξάσκηση & Εμπέδωση"):"AI Studio";
  return <div className="workspace-material-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}>
    <section aria-modal="true" role="dialog" aria-labelledby="workspace-material-title" className="workspace-material-dialog">
      <header className="workspace-material-heading">
        <div><p>{text("Stored material management","Διαχείριση αποθηκευμένου υλικού")}</p><h2 id="workspace-material-title">{title}</h2></div>
        <button ref={closeRef} type="button" disabled={busy} onClick={onClose}>{text("Close","Κλείσιμο")}</button>
      </header>
      {panel==="ai" ? <p>{text("AI Studio does not store AI chats or files locally. There is nothing to delete here.","Το AI Studio δεν αποθηκεύει τοπικά συνομιλίες ή αρχεία AI. Δεν υπάρχει υλικό προς διαγραφή.")}</p> :
       <>
        <p>{text("Only imported material is removed. Progress, sessions and settings remain available in Standard and BETA.","Διαγράφεται μόνο εισαγόμενο υλικό. Πρόοδος, συνεδρίες και προσωπικές ρυθμίσεις παραμένουν διαθέσιμες και στις δύο εκδόσεις.")}</p>
        <div className="workspace-material-actions">
          <button disabled={busy||loading||!items.length} type="button" onClick={()=>setSelected(items.map(item=>item.key))}>{text("Select all","Επιλογή όλων")}</button>
          <button disabled={busy||loading} type="button" onClick={()=>setSelected([])}>{text("Clear selection","Καμία επιλογή")}</button>
          <button className="workspace-material-danger" disabled={busy||!selected.length} type="button" onClick={()=>void remove(false)}>{text("Delete selected","Διαγραφή επιλεγμένων")}</button>
          <button className="workspace-material-danger" disabled={busy||loading||!items.length} type="button" onClick={()=>void remove(true)}>{text("Delete all","Διαγραφή όλων")}</button>
        </div>
        <div className="workspace-material-items">
          {loading?<p>{text("Loading…","Φόρτωση…")}</p>:items.length===0?<p>{text("No imported material in this section.","Δεν υπάρχει εισαγόμενο υλικό σε αυτή την ενότητα.")}</p>:
          items.map(item=><label key={item.key}><input type="checkbox" disabled={busy} checked={selected.includes(item.key)} onChange={e=>setSelected(current=>e.target.checked?[...current,item.key]:current.filter(k=>k!==item.key))}/><span><strong>{item.title}</strong><small>{item.detail}</small></span></label>)}
        </div>
       </>}
      {error?<p role="status" className="workspace-material-status">{error}</p>:null}
    </section>
  </div>;
}
