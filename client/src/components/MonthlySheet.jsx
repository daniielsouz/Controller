const formatMoney = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

const computeTotals = (rows) =>
  rows.reduce(
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

const sortTransactionsAscending = (rows) =>
  [...rows].sort((left, right) => {
    const dateCompare =
      new Date(left.purchaseDate || "1970-01-01").getTime() -
      new Date(right.purchaseDate || "1970-01-01").getTime();

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return String(left.description || "").localeCompare(String(right.description || ""), "pt-BR");
  });

const buildSections = (transactions) => {
  const deposits = sortTransactionsAscending(
    transactions.filter((item) => item.type === "deposito")
  );
  const vehicle = sortTransactionsAscending(
    transactions.filter((item) => item.category === "veiculos")
  );
  const others = sortTransactionsAscending(
    transactions.filter((item) => item.category === "outras-despesas")
  );

  return [
    { title: "DEPOSITOS", rows: deposits },
    { title: "DESPESAS COM VEICULO", rows: vehicle },
    { title: "OUTRAS DESPESAS", rows: others }
  ];
};

export default function MonthlySheet({
  month,
  user,
  onEdit,
  onDelete,
  canEdit = true,
  onExportPdf,
  isExportingPdf = false
}) {
  const sections = buildSections(month.transactions || []);
  const getBalanceColorClass = (value) => {
    if (Number(value) > 0) {
      return "balance-positive";
    }

    if (Number(value) < 0) {
      return "balance-negative";
    }

    return "";
  };

  return (
    <div className="financial-sheet">
      <table className="financial-sheet-table">
        <tbody>
          <tr>
            <td colSpan="7" className="sheet-title">CONTROLE FINANCEIRO</td>
          </tr>
          <tr>
            <td colSpan="7" className="sheet-subtitle">
              MUNICIPIO: {month.municipality || "Chapeco"}
            </td>
          </tr>
          <tr>
            <td colSpan="7" className="sheet-subtitle">
              {user?.name}
            </td>
          </tr>
          <tr className="sheet-head">
            <td>DATA</td>
            <td>Nº</td>
            <td>Descricao</td>
            <td>Nº Nota</td>
            <td className="debit-head">Debito</td>
            <td className="credit-head">Credito</td>
            <td>SALDO ANTERIOR</td>
          </tr>
          <tr>
            <td />
            <td />
            <td />
            <td />
            <td />
            <td />
            <td
              className={`money debit-head saldo-highlight ${getBalanceColorClass(
                month.openingBalance
              )}`}
            >
              {formatMoney(month.openingBalance)}
            </td>
          </tr>

          {sections.map((section) => {
            const totals = computeTotals(section.rows);
            const isDepositSection = section.title === "DEPOSITOS";

            return (
              <>
                <tr key={`${section.title}-title`}>
                  <td colSpan="7" className="sheet-section-title">{section.title}</td>
                </tr>
                {section.rows.length === 0 ? (
                  <tr key={`${section.title}-empty`}>
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                    <td />
                  </tr>
                ) : (
                  section.rows.map((transaction, index) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.purchaseDate)}</td>
                      <td>{index + 1}</td>
                      <td className="left">
                        <div>{transaction.description}</div>
                        <div className="sheet-mini-actions">
                          {canEdit && (
                            <button
                              className="ghost mini-button edit-action action-btn"
                              type="button"
                              onClick={() => onEdit(transaction)}
                              title="Editar movimento"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </button>
                          )}
                          {canEdit && (
                            <button
                              className="danger mini-button delete-action action-btn"
                              type="button"
                              onClick={() => onDelete(transaction.id)}
                              title="Excluir movimento"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                <path d="M3 6h18" />
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                          {transaction.receiptUrl && (
                            <a
                              href={transaction.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Abrir nota"
                              className="receipt-icon"
                              title="Abrir nota"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                                <path d="M14 2v5a1 1 0 0 0 1 1h5" />
                                <path d="m9 15 2 2 4-4" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </td>
                      <td>{transaction.invoiceNumber || ""}</td>
                      <td className="money">
                        {transaction.type === "debito" ? formatMoney(transaction.amount) : ""}
                      </td>
                      <td className="money">
                        {transaction.type === "credito" ? formatMoney(transaction.amount) : ""}
                      </td>
                      <td className="money">
                        {transaction.type === "deposito" ? formatMoney(transaction.amount) : ""}
                      </td>
                    </tr>
                  ))
                )}
                <tr key={`${section.title}-total`} className="sheet-total-line">
                  <td colSpan="4">{isDepositSection ? "TOTAL DEPOSITO EM CONTA" : "TOTAL DESPESAS"}</td>
                  <td className="money">{isDepositSection ? "" : totals.debits ? formatMoney(totals.debits) : "0,00"}</td>
                  <td className="money">{isDepositSection ? "" : totals.credits ? formatMoney(totals.credits) : "0,00"}</td>
                  <td className="money">{isDepositSection ? totals.deposits ? formatMoney(totals.deposits) : "0,00" : ""}</td>
                </tr>
              </>
            );
          })}

          <tr className="sheet-total-line">
            <td colSpan="4">DEPOSITO + SALDO ANTERIOR</td>
            <td className="money" />
            <td className="money" />
            <td
              className={`money debit-head saldo-highlight ${getBalanceColorClass(
                month.openingBalance + month.deposits
              )}`}
            >
              {formatMoney(month.openingBalance + month.deposits)}
            </td>
          </tr>

          <tr>
            <td colSpan="4" />
            <td className="sheet-footer-title">GASTOS DEBITO</td>
            <td className="sheet-footer-title">GASTOS CREDITO</td>
            <td />
          </tr>
          <tr className="sheet-final-row">
            <td colSpan="4">SALDO FINAL</td>
            <td className="money">{formatMoney(month.debits)}</td>
            <td className="money">{formatMoney(month.credits)}</td>
            <td
              className={`money debit-head ${getBalanceColorClass(month.closingBalance)}`}
            >
              {formatMoney(month.closingBalance)}
            </td>
          </tr>
          <tr>
            <td colSpan="7">
              <div className="sheet-actions sheet-actions-end">
                <button
                  className="ghost action-btn"
                  type="button"
                  onClick={onExportPdf}
                  disabled={isExportingPdf}
                  title="Exportar PDF"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 15V3" />
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="m7 10 5 5 5-5" />
                  </svg>
                  <span>{isExportingPdf ? "Gerando PDF..." : "Exportar PDF"}</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
