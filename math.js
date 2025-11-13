function columnToNumber(col) {
  col = col.toUpperCase();

  let num = 0;

  for (let i = 0; i < col.length; i++) {
    num = num * 26 + (col.charCodeAt(i) - 64);
  }

  return num;
}

function numberToColumn(n) {
  let col = '';

  while (n > 0) {
    const rem = (n - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    n = Math.floor((n - 1) / 26);
  }

  return col;
}

function addOffsetToColumn(col, offset) {
  return numberToColumn(columnToNumber(col) + offset);
}

export default {
  columnToNumber,
  numberToColumn,
  addOffsetToColumn,
};