import { useEffect, useRef, useState } from "react";

const initialForm = {
  purchaseDate: "",
  description: "",
  invoiceNumber: "",
  category: "",
  type: "",
  amount: ""
};

export default function TransactionForm({
  year,
  month,
  onSubmit,
  editingTransaction,
  onCancel,
  disabled = false,
  isSubmitting = false
}) {
  const [form, setForm] = useState(initialForm);
  const [receipt, setReceipt] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingTransaction) {
      setForm({
        purchaseDate: editingTransaction.purchaseDate,
        description: editingTransaction.description,
        invoiceNumber: editingTransaction.invoiceNumber || "",
        category: editingTransaction.category,
        type: editingTransaction.type,
        amount: editingTransaction.amount
      });
    } else {
      setForm(initialForm);
      setReceipt(null);
    }
  }, [editingTransaction]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };

      if (name === "category" && value === "depositos") {
        next.type = "deposito";
        next.description = "Deposito em conta";
        next.invoiceNumber = "";
      }

      if (name === "category" && value !== "depositos" && current.type === "deposito") {
        next.type = "";
      }

      if (
        name === "category" &&
        value !== "depositos" &&
        current.description === "Deposito em conta"
      ) {
        next.description = "";
      }

      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const payload = new FormData();
    payload.append("year", year);
    payload.append("month", month);
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (receipt) {
      payload.append("receipt", receipt);
    }

    await onSubmit(payload);

    setForm(initialForm);
    setReceipt(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h3>{editingTransaction ? "Editar movimento" : "Novo movimento"}</h3>
      <label>
        Categoria
        <select name="category" value={form.category} onChange={handleChange} required disabled={disabled}>
          <option value="">Selecione a opcao</option>
          <option value="depositos">Depositos</option>
          <option value="veiculos">Veiculos</option>
          <option value="outras-despesas">Outras despesas</option>
        </select>
      </label>
      <label>
        Data
        <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} required disabled={disabled} />
      </label>
      <label>
        Descricao
        <input name="description" value={form.description} onChange={handleChange} required disabled={disabled} />
      </label>
      <label>
        Numero da nota
        <input
          name="invoiceNumber"
          value={form.invoiceNumber}
          onChange={handleChange}
          disabled={disabled || form.category === "depositos"}
        />
      </label>
      <label>
        Tipo de movimento
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          disabled={disabled || form.category === "depositos"}
          required={form.category !== "depositos"}
        >
          <option value="">Selecione a opcao</option>
          <option value="debito">Debito</option>
          <option value="credito">Credito</option>
        </select>
      </label>
      <label>
        Valor
        <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={handleChange} required disabled={disabled} />
      </label>
      <label>
        Foto da nota
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={disabled}
          onChange={(event) => setReceipt(event.target.files?.[0] || null)}
        />
      </label>
      {disabled && (
        <p className="muted">Este mes ainda nao pode ser editado. A edicao sera liberada quando o mes chegar.</p>
      )}
      <div className="form-actions">
        <button className="primary" type="submit" disabled={disabled}>
          {isSubmitting
            ? editingTransaction
              ? "Atualizando..."
              : "Adicionando..."
            : editingTransaction
              ? "Salvar edicao"
              : "Adicionar movimento"}
        </button>
        {editingTransaction && (
          <button className="ghost" type="button" onClick={onCancel} disabled={disabled}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
