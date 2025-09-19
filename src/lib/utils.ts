export const parseExp = (exp: string): number => {
  const expNumber = Number(exp);

  return expNumber > 9999999999 ? expNumber : expNumber * 1000;
};

export const isExpired = (exp: number, buffer = 5) => {
  return Date.now() >= exp * 1000 - buffer * 1000;
};
