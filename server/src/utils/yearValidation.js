export const getCurrentYear = () => new Date().getFullYear();

export const validateAllowedYear = (year) => {
  const currentYear = getCurrentYear();

  if (!Number.isInteger(year) || year < 2000) {
    return "Ano invalido.";
  }

  if (year > currentYear) {
    return "Nao e permitido acessar anos futuros.";
  }

  return null;
};
