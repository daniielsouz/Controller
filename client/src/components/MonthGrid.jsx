const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

export default function MonthGrid({ months, selectedMonth, onSelect }) {
  return (
    <div className="month-tabs" role="tablist" aria-label="Meses do ano">
      {months.map((month) => (
        <button
          key={`${month.year}-${month.month}`}
          type="button"
          className={`month-tab ${selectedMonth?.month === month.month ? "active" : ""}`}
          onClick={() => onSelect(month)}
        >
          <strong>{monthNames[month.month - 1]}</strong>
          <span>R$ {month.closingBalance.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
}
