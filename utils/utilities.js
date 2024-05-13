function roundToFixed(value, precision) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function convertToISODate(timestampString) {
  const year = parseInt(timestampString.substring(0, 4));
  const month = parseInt(timestampString.substring(4, 6)) - 1;
  const day = parseInt(timestampString.substring(6, 8));
  const timestampDate = new Date(year, month, day);
  const isoDateString = timestampDate.toISOString();
  return isoDateString;
}

module.exports = { roundToFixed, convertToISODate };
