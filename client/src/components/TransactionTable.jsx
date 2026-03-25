export default function TransactionTable({ transactions, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descricao</th>
              <th>Nota</th>
              <th>Categoria</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Comprovante</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="8">Nenhum lancamento neste mes.</td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.purchaseDate}</td>
                  <td>{transaction.description}</td>
                  <td>{transaction.invoiceNumber || "-"}</td>
                  <td>{transaction.category}</td>
                  <td>{transaction.type}</td>
                  <td>R$ {transaction.amount.toFixed(2)}</td>
                  <td>
                    {transaction.receiptUrl ? (
                      <a href={transaction.receiptUrl} target="_blank" rel="noreferrer">
                        Ver nota
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="ghost action-btn edit-btn"
                      type="button"
                      onClick={() => onEdit(transaction)}
                      title="Editar movimento"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
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
                    <button
                      className="danger action-btn delete-btn"
                      type="button"
                      onClick={() => onDelete(transaction.id)}
                      title="Excluir movimento"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
