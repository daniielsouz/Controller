const VALID_CATEGORIES = ["depositos", "veiculos", "outras-despesas"];
const VALID_TYPES = ["deposito", "debito", "credito"];

const isValidDateString = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) &&
  !Number.isNaN(new Date(`${value}T00:00:00`).getTime());

const isFutureDate = (value) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedDate = new Date(`${value}T00:00:00`);
  parsedDate.setHours(0, 0, 0, 0);

  return parsedDate.getTime() > today.getTime();
};

export const validateTransactionPayload = ({
  year,
  month,
  purchaseDate,
  description,
  invoiceNumber,
  category,
  type,
  amount
}) => {
  if (!VALID_CATEGORIES.includes(category)) {
    return "Categoria invalida.";
  }

  if (!VALID_TYPES.includes(type)) {
    return "Tipo de movimento invalido.";
  }

  if (!isValidDateString(purchaseDate)) {
    return "Data da compra invalida.";
  }

  if (isFutureDate(purchaseDate)) {
    return "A data da compra nao pode ser futura.";
  }

  const parsedDate = new Date(`${purchaseDate}T00:00:00`);
  const payloadYear = Number(year);
  const payloadMonth = Number(month);

  if (
    parsedDate.getFullYear() !== payloadYear ||
    parsedDate.getMonth() + 1 !== payloadMonth
  ) {
    return "A data da compra deve pertencer ao mes selecionado.";
  }

  if (!String(description || "").trim()) {
    return "Descricao obrigatoria.";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return "O valor deve ser maior que zero.";
  }

  if (category === "depositos") {
    if (type !== "deposito") {
      return "Depositos devem usar o tipo deposito.";
    }
  } else if (type === "deposito") {
    return "Apenas a categoria depositos pode usar o tipo deposito.";
  }

  if (category === "depositos" && String(invoiceNumber || "").trim()) {
    return "Depositos nao devem ter numero da nota.";
  }

  if (
    String(invoiceNumber || "").trim() &&
    String(invoiceNumber).trim() !== "Recibo" &&
    !/^\d+$/.test(String(invoiceNumber).trim())
  ) {
    return "Numero da nota deve conter apenas numeros.";
  }

  return null;
};

export const validateMonthPayload = ({ municipality, notes }) => {
  if (municipality !== undefined && !String(municipality || "").trim()) {
    return "Municipio obrigatorio.";
  }

  if (String(municipality || "").length > 120) {
    return "Municipio muito longo.";
  }

  if (String(notes || "").length > 5000) {
    return "Observacoes muito longas.";
  }

  return null;
};
