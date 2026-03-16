const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatMoney = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

const balanceStatusLabel = (status) => {
  if (status === "voce_deve_empresa") {
    return "Voce esta devendo a empresa";
  }

  if (status === "empresa_deve_voce") {
    return "A empresa esta devendo voce";
  }

  return "Saldo zerado";
};

const sectionTitle = (type) => {
  if (type === "deposito") {
    return "Deposito em conta";
  }

  if (type === "debito") {
    return "Movimentos no debito";
  }

  return "Credito";
};

const impactLabel = (transaction) => {
  if (transaction.type === "deposito") {
    return `+ ${formatMoney(transaction.amount)}`;
  }

  if (transaction.type === "debito") {
    return `- ${formatMoney(transaction.amount)}`;
  }

  return "Nao altera saldo";
};

const buildRows = (transactions) =>
  transactions
    .map(
      (transaction) => `
        <tr>
          <td>${escapeHtml(formatDate(transaction.purchaseDate))}</td>
          <td>${escapeHtml(transaction.description)}</td>
          <td>${escapeHtml(transaction.invoiceNumber || "-")}</td>
          <td>${escapeHtml(transaction.category)}</td>
          <td>${escapeHtml(transaction.type)}</td>
          <td class="money">${escapeHtml(
            transaction.type === "deposito" ? formatMoney(transaction.amount) : "-"
          )}</td>
          <td class="money">${escapeHtml(
            transaction.type === "debito" ? formatMoney(transaction.amount) : "-"
          )}</td>
          <td class="money">${escapeHtml(
            transaction.type === "credito" ? formatMoney(transaction.amount) : "-"
          )}</td>
          <td>${escapeHtml(impactLabel(transaction))}</td>
          <td>${transaction.receiptUrl ? `<a href="${escapeHtml(transaction.receiptUrl)}">Abrir</a>` : "-"}</td>
        </tr>`
    )
    .join("");

const computeTotals = (transactions) =>
  transactions.reduce(
    (accumulator, transaction) => {
      const amount = Number(transaction.amount || 0);

      if (transaction.type === "deposito") {
        accumulator.deposits += amount;
      } else if (transaction.type === "debito") {
        accumulator.debits += amount;
      } else if (transaction.type === "credito") {
        accumulator.credits += amount;
      }

      return accumulator;
    },
    { deposits: 0, debits: 0, credits: 0 }
  );

const buildSection = (type, transactions) => `
  <section class="block">
    <h2>${sectionTitle(type)}</h2>
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descricao</th>
          <th>Nota</th>
          <th>Categoria</th>
          <th>Tipo</th>
          <th>Depositos</th>
          <th>Debito</th>
          <th>Credito</th>
          <th>Impacto no saldo</th>
          <th>Comprovante</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.length > 0 ? buildRows(transactions) : '<tr><td colspan="10">Nenhum lancamento nesta secao.</td></tr>'}
        <tr class="section-total">
          <td colspan="5">Total da categoria</td>
          <td class="money">${escapeHtml(formatMoney(computeTotals(transactions).deposits))}</td>
          <td class="money">${escapeHtml(formatMoney(computeTotals(transactions).debits))}</td>
          <td class="money">${escapeHtml(formatMoney(computeTotals(transactions).credits))}</td>
          <td>Subtotal da secao</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </section>`;

export const generateMonthlyDoc = ({ user, monthData }) => {
  const deposits = (monthData.transactions || []).filter((item) => item.type === "deposito");
  const debits = (monthData.transactions || []).filter((item) => item.type === "debito");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Controle Financeiro</title>
    <style>
      body {
        font-family: Calibri, Arial, sans-serif;
        color: #243746;
        margin: 24px;
      }
      h1 {
        margin: 0 0 6px;
        font-size: 22px;
      }
      h2 {
        margin: 0 0 10px;
        font-size: 15px;
      }
      .subtitle {
        margin: 0 0 18px;
        color: #5d6d7b;
      }
      .summary {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 18px;
      }
      .summary td {
        border: 1px solid #cfd8df;
        padding: 8px 10px;
      }
      .summary .label {
        font-weight: 700;
        background: #eef3f7;
        width: 220px;
      }
      .block {
        margin-top: 18px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      th, td {
        border: 1px solid #cfd8df;
        padding: 7px 8px;
        font-size: 11px;
        vertical-align: top;
        word-wrap: break-word;
      }
      th {
        background: #dde7ef;
        text-align: left;
      }
      .money {
        text-align: right;
      }
      .total-table {
        margin-top: 18px;
      }
      .total-table td:first-child {
        font-weight: 700;
        background: #eef3f7;
      }
      .highlight td {
        background: #e7f0f8;
        font-weight: 700;
      }
      .section-total td {
        background: #fafcfd;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <h1>Controle Financeiro Mensal</h1>
    <p class="subtitle">Documento compativel com Word e LibreOffice Writer</p>

    <table class="summary">
      <tr><td class="label">Responsavel</td><td>${escapeHtml(user.name)}</td></tr>
      <tr><td class="label">Email</td><td>${escapeHtml(user.email)}</td></tr>
      <tr><td class="label">Periodo</td><td>${escapeHtml(String(monthData.month).padStart(2, "0"))}/${escapeHtml(monthData.year)}</td></tr>
      <tr><td class="label">Saldo anterior</td><td>${escapeHtml(formatMoney(monthData.openingBalance))}</td></tr>
      <tr><td class="label">Deposito em conta</td><td>${escapeHtml(formatMoney(monthData.deposits))}</td></tr>
      <tr><td class="label">Total debito</td><td>${escapeHtml(formatMoney(monthData.debits))}</td></tr>
      <tr><td class="label">Total credito</td><td>${escapeHtml(formatMoney(monthData.credits))}</td></tr>
      <tr><td class="label">Saldo final</td><td>${escapeHtml(formatMoney(monthData.closingBalance))}</td></tr>
      <tr><td class="label">Status do saldo</td><td>${escapeHtml(balanceStatusLabel(monthData.balanceStatus))}</td></tr>
      <tr><td class="label">Regra</td><td>Saldo anterior + depositos - debitos. O credito nao entra no saldo.</td></tr>
      <tr><td class="label">Observacoes</td><td>${escapeHtml(monthData.notes || "-")}</td></tr>
    </table>

    ${buildSection("deposito", deposits)}
    ${buildSection("debito", debits)}

    <table class="summary total-table">
      <tr><td class="label">Deposito em conta</td><td>${escapeHtml(formatMoney(monthData.deposits))}</td></tr>
      <tr><td class="label">Total debito</td><td>${escapeHtml(formatMoney(monthData.debits))}</td></tr>
      <tr><td class="label">Total credito</td><td>${escapeHtml(formatMoney(monthData.credits))}</td></tr>
      <tr class="highlight"><td>Saldo final</td><td>${escapeHtml(formatMoney(monthData.closingBalance))}</td></tr>
      <tr class="highlight"><td>Total geral das movimentacoes</td><td>${escapeHtml(formatMoney(monthData.deposits + monthData.debits + monthData.credits))}</td></tr>
    </table>
  </body>
</html>`;

  return Buffer.from(html, "utf-8");
};
