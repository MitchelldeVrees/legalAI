export const buildRechtspraakDetailUrl = (ecli) => {
  const value = String(ecli || "").trim();
  if (!value) {
    return "";
  }

  return `https://uitspraken.rechtspraak.nl/details?id=${encodeURIComponent(
    value
  )}&showbutton=true&idx=1`;
};
