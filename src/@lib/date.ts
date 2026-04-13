export const formatDateTime = (date: Date = new Date()) => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };

  const formatter = new Intl.DateTimeFormat("pt-BR", options);
  const timestamp = formatter.format(date);

  return timestamp;
};
