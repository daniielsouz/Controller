export const isMonthEditable = (year, month, referenceDate = new Date()) => {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1;

  if (year < currentYear) {
    return true;
  }

  if (year > currentYear) {
    return false;
  }

  return month <= currentMonth;
};

export const validateEditableMonth = (year, month) =>
  isMonthEditable(year, month) ? null : "Este mes ainda nao pode ser editado.";
