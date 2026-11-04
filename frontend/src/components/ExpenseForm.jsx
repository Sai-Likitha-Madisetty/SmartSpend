import { useState } from "react";
import { Icon } from "./Icons.jsx";

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function ExpenseForm({ expense, categories, onClose, onSave }) {
  const isEditing = Boolean(expense.id);
  const [values, setValues] = useState({
    amount: expense.amount ?? "",
    description: expense.description ?? "",
    transaction_date: expense.transaction_date ?? today(),
    category: expense.category ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        amount,
        description: values.description.trim(),
        transaction_date: values.transaction_date,
        category: values.category || null,
      });
    } catch (requestError) {
      setError(requestError.message || "Could not save this expense.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
        <div className="modal-heading"><div><p className="eyebrow">{isEditing ? "TRANSACTION DETAILS" : "NEW TRANSACTION"}</p><h2 id="expense-modal-title">{isEditing ? "Edit expense" : "Add an expense"}</h2></div><button className="icon-button modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button></div>
        <p className="modal-subtitle">{isEditing ? "Update the details of this transaction." : "Capture the details now. SmartSpend can suggest a category for you."}</p>
        <form className="expense-form" onSubmit={submit}>
          <label className="form-field"><span>Amount</span><div className="amount-input"><span>$</span><input type="number" value={values.amount} onChange={(event) => update("amount", event.target.value)} placeholder="0.00" min="0.01" max="100000000" step="0.01" required autoFocus /></div></label>
          <label className="form-field"><span>Description</span><input value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="e.g. Coffee with friends" maxLength={255} required /></label>
          <div className="form-two-col">
            <label className="form-field"><span>Date</span><input type="date" value={values.transaction_date} onChange={(event) => update("transaction_date", event.target.value)} required /></label>
            <label className="form-field"><span>Category <em>optional</em></span><select value={values.category} onChange={(event) => update("category", event.target.value)}><option value="">Auto-categorize</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
          </div>
          <div className="categorize-note"><Icon name="spark" size={16} /><span>Leave the category blank and SmartSpend will make a suggestion.</span></div>
          {error && <div className="form-error"><Icon name="alert" size={16} /><span>{error}</span></div>}
          <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? <span className="button-spinner" /> : <>{isEditing ? "Save changes" : "Add expense"} <Icon name="arrow" /></>}</button></div>
        </form>
      </section>
    </div>
  );
}
