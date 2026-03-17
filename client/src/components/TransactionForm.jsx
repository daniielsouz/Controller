import { useEffect, useRef, useState } from "react";

const initialForm = {
  purchaseDate: "",
  description: "",
  invoiceNumber: "",
  category: "",
  type: "",
  amount: ""
};

const formatCurrencyInput = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const amount = Number(digits) / 100;

  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const parseCurrencyInput = (value) => {
  const normalized = String(value || "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  return normalized || "";
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
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (editingTransaction) {
      setForm({
        purchaseDate: editingTransaction.purchaseDate,
        description: editingTransaction.description,
        invoiceNumber: editingTransaction.invoiceNumber || "",
        category: editingTransaction.category,
        type: editingTransaction.type,
        amount: formatCurrencyInput(editingTransaction.amount)
      });
    } else {
      setForm(initialForm);
      setReceipt(null);
    }
  }, [editingTransaction]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next = {
        ...current,
        [name]: name === "amount" ? formatCurrencyInput(value) : value
      };

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
    Object.entries(form).forEach(([key, value]) =>
      payload.append(key, key === "amount" ? parseCurrencyInput(value) : value)
    );
    if (receipt) {
      payload.append("receipt", receipt);
    }

    await onSubmit(payload);

    setForm(initialForm);
    setReceipt(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = "";
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
        <div className="form-actions">
          <label className="muted">
            <input
              type="radio"
              name="type"
              value="debito"
              checked={form.type === "debito"}
              onChange={handleChange}
              disabled={disabled || form.category === "depositos"}
              required={form.category !== "depositos"}
            />
            {" "}Debito
          </label>
          <label className="muted">
            <input
              type="radio"
              name="type"
              value="credito"
              checked={form.type === "credito"}
              onChange={handleChange}
              disabled={disabled || form.category === "depositos"}
              required={form.category !== "depositos"}
            />
            {" "}Credito
          </label>
        </div>
      </label>
      <label>
        Valor
        <input
          name="amount"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={form.amount}
          onChange={handleChange}
          required
          disabled={disabled}
        />
      </label>
      <label>
        Foto da nota
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={disabled}
          onChange={(event) => setReceipt(event.target.files?.[0] || null)}
          hidden
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(event) => setReceipt(event.target.files?.[0] || null)}
          hidden
        />
        <div className="form-actions">
          <button
            className="ghost"
            type="button"
            disabled={disabled}
            onClick={() => cameraInputRef.current?.click()}
          >
            Tirar foto
          </button>
          <button
            className="ghost"
            type="button"
            disabled={disabled}
            onClick={() => galleryInputRef.current?.click()}
          >
            Escolher arquivo
          </button>
        </div>
        {receipt && <p className="muted">{receipt.name}</p>}
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
