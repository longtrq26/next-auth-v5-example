export const parseExp = (exp: string): number => {
  const expNumber = Number(exp);

  return expNumber > 9999999999 ? expNumber : expNumber * 1000;
};
