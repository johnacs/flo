function roundToFixed(value, precision) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
module.exports = { roundToFixed };
