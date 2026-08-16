export function calcularCotacao(
  itens: { quantidade: number; valorIntegralUnitario: number }[],
  percentualDescontoGlobal: number,
  percentualRoyalties: number
) {
  const mensalidadeIntegral = itens.reduce(
    (sum, item) => sum + item.quantidade * item.valorIntegralUnitario,
    0
  );

  const descontoGlobal = mensalidadeIntegral * (percentualDescontoGlobal / 100);
  const totalMensalidade = mensalidadeIntegral - descontoGlobal;
  const totalRoyalties = totalMensalidade * (percentualRoyalties / 100);

  return {
    mensalidadeIntegral,
    descontoGlobal,
    totalMensalidade,
    totalRoyalties,
    margemLiquida: totalMensalidade - totalRoyalties,
  };
}
