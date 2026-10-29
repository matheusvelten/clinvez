export function paraNumero(valor: { toString(): string } | number | null | undefined): number {
  if (valor === null || valor === undefined) return 0;
  return Number(valor.toString());
}
