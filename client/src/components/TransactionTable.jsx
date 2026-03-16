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
                    <button className="ghost" type="button" onClick={() => onEdit(transaction)}>
                      Editar
                    </button>
                    <button className="danger" type="button" onClick={() => onDelete(transaction.id)}>
                      Excluir
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
