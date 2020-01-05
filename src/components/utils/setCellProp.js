const setCellProp = (cells, rowParam, colParam, property, value) => {
  return cells.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (rowParam === rowIndex && colParam === colIndex) {
        return {
          ...cell,
          [property]: value
        };
      }
      return cell;
    })
  );
};

export default setCellProp;
