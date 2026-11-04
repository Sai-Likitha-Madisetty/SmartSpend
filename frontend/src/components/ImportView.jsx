import { useRef, useState } from "react";
import { Icon } from "./Icons.jsx";

export default function ImportView({ onImport }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function chooseFile(candidate) {
    setError("");
    setResult(null);
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setError("Choose a .csv file to continue.");
      return;
    }
    setFile(candidate);
  }

  async function submit(event) {
    event.preventDefault();
    if (!file) {
      setError("Choose a CSV file before importing.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await onImport(file);
      setResult(response);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (importError) {
      setError(importError.message || "Import failed. Check your file and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="import-layout">
      <section className="panel import-panel">
        <div className="panel-heading"><div><h2>Bring your spending with you</h2><p>Import a CSV and let SmartSpend take care of the busywork.</p></div><div className="import-heading-icon"><Icon name="upload" /></div></div>
        <form onSubmit={submit}>
          <label
            className={`dropzone ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }}
          >
            <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={(event) => chooseFile(event.target.files[0])} />
            <div className="dropzone-icon"><Icon name={file ? "file" : "cloud"} size={23} /></div>
            {file ? <><strong>{file.name}</strong><span>{(file.size / 1024).toFixed(1)} KB · Ready to import</span><button type="button" className="remove-file" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ""; }}>Remove file</button></> : <><strong>Drop your CSV file here</strong><span>or <u>browse files</u> on your device</span><small>CSV files only · UTF-8 encoded</small></>}
          </label>
          {error && <div className="form-error import-error"><Icon name="alert" size={16} /><span>{error}</span></div>}
          {result && <div className="import-result"><div className="result-check"><Icon name="check" /></div><div className="result-copy"><strong>{result.message}</strong><span>Import summary returned by SmartSpend</span></div><div className="result-counts"><div><strong>{Number(result.imported ?? 0).toLocaleString()}</strong><span>Imported</span></div><div><strong>{Number(result.rejected ?? 0).toLocaleString()}</strong><span>Rejected</span></div></div></div>}
          <button className="button button-primary import-submit" disabled={busy || !file}>{busy ? <><span className="button-spinner" /> Importing transactions…</> : <>Import transactions <Icon name="arrow" /></>}</button>
        </form>
        <div className="csv-schema"><div className="schema-icon"><Icon name="file" /></div><div><strong>Simple, predictable formatting</strong><p>Your CSV must include <code>amount</code>, <code>description</code>, and <code>transaction_date</code> columns. <code>category</code> is optional.</p></div></div>
      </section>

      <aside className="import-aside">
        <section className="panel import-info"><p className="eyebrow">WHAT HAPPENS NEXT</p><h3>Import with confidence.</h3><div className="import-steps"><ImportStep number="01" title="We validate" text="Required columns and each transaction are checked." /><ImportStep number="02" title="We categorize" text="SmartSpend suggests categories when one is missing." /><ImportStep number="03" title="You get the details" text="See exactly how many records were imported or rejected." /></div></section>
        <div className="secure-import"><Icon name="shield" /><span>Your data is sent securely and attached only to your account.</span></div>
      </aside>
    </div>
  );
}

function ImportStep({ number, title, text }) {
  return <div className="import-step"><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></div>;
}
