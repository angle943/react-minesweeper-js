import React, { useEffect, useState } from "react";

import "./App.css";
import NumberDisplay from "../NumberDisplay";
import Button from "../Button";
import generateCells from "../utils/generateCells";
import setCellProp from "../utils/setCellProp";

const App = () => {
  const [cells, setCells] = useState(generateCells());
  const [mineCounter, setMineCounter] = useState(10);
  const [time, setTime] = useState(0);
  const [face, setFace] = useState("😁");
  const [isLive, setIsLive] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [hasLost, setHasLost] = useState(false);

  useEffect(() => {
    if (isLive && !hasWon && !hasLost) {
      const interval = setInterval(() => {
        if (time < 1000) {
          setTime(time + 1);
        }
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [time, isLive, hasWon, hasLost]);

  const handleMouseDown = e => {
    if (hasWon || hasLost) {
      return;
    }

    setFace("😮");
  };

  const handleMouseUp = e => {
    if (hasWon || hasLost) {
      return;
    }

    setFace("😁");
  };

  useEffect(() => {
    if (hasLost) {
      setFace("😵");
    }
  }, [hasLost]);

  useEffect(() => {
    if (hasWon) {
      const newCells = cells.map(row =>
        row.map(cell =>
          cell.value === -1
            ? {
                ...cell,
                state: 1
              }
            : cell
        )
      );
      setCells(newCells);
      setFace("😎");
    }
  }, [hasWon]);

  useEffect(() => {
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [face, hasWon, hasLost]);

  const renderRows = () => {
    return cells.map((row, rowIndex) => {
      return renderButtonsForRow(row, rowIndex);
    });
  };

  const renderButtonsForRow = (row, rowIndex) => {
    return row.map((cell, colIndex) => (
      <Button
        state={cell.state}
        value={cell.value}
        red={cell.red}
        key={`${rowIndex}-${colIndex}`}
        onClick={handleButtonClick}
        onContext={handleButtonContextMenu}
        row={rowIndex}
        col={colIndex}
      />
    ));
  };

  const handleButtonClick = (rowParam, colParam) => e => {
    e.preventDefault();

    if (hasWon || hasLost) {
      return;
    }

    let gameCells = cells;
    let cell = gameCells[rowParam][colParam];

    if (!isLive) {
      // if the click place has a bomb, reshuffle the board
      if (cell.value === -1) {
        let hasABomb = true;
        let newCells = gameCells;
        while (hasABomb) {
          newCells = generateCells();
          const newCell = newCells[rowParam][colParam];
          if (newCell.value !== -1) {
            hasABomb = false;
          }
        }
        gameCells = newCells;
        cell = gameCells[rowParam][colParam];
      }

      setIsLive(true);
    }

    // only do something if state is zero
    if (cell.state !== 0) {
      return;
    }

    // if bomb, game over.
    if (cell.value === -1) {
      setHasLost(true);
      let newCells = setCellProp(gameCells, rowParam, colParam, "red", true);
      newCells = openAllBombs(newCells);
      setCells(newCells);
      return;
    }

    // if nothing, spread
    if (cell.value === 0) {
      gameCells = openMultiple(gameCells, rowParam, colParam);
    }
    // display number
    if (cell.value > 0) {
      gameCells = setCellProp(gameCells, rowParam, colParam, "state", 1);
    }
    // if all non-bomb spaces have been pressed, then won
    const availableNonBombSpaces = gameCells.reduce(
      (acc, row) =>
        acc +
        row.reduce(
          (acc2, cell) =>
            cell.value !== -1 && cell.state === 0 ? acc2 + 1 : acc2,
          0
        ),
      0
    );

    setCells(gameCells);

    if (availableNonBombSpaces === 0) {
      gameCells.map(row => row.map(cell => ({ ...cell, state: 1 })));
      setHasWon(true);
    }
  };

  const handleButtonContextMenu = (rowParam, colParam) => e => {
    e.preventDefault();

    if (hasWon || hasLost) {
      return;
    }

    if (!isLive) return;

    const cell = cells[rowParam][colParam];

    // if already visible, don't do anything
    if (cell.state === 1) {
      return;
    }

    // if not flagged, flag it
    if (cell.state === 0) {
      let newCells = setCellProp(cells, rowParam, colParam, "state", 2);
      setCells(newCells);
      setMineCounter(mineCounter - 1);
      return;
    }

    // if flagged, unflag it
    const newCells = setCellProp(cells, rowParam, colParam, "state", 0);
    setCells(newCells);
    setMineCounter(mineCounter + 1);
  };

  const handleFaceClick = e => {
    e.preventDefault();
    if (isLive) {
      setCells(generateCells());
      setIsLive(false);
      setMineCounter(10);
      setTime(0);
      setHasLost(false);
      setHasWon(false);
      setFace("😁");
    }
  };

  const openAllBombs = cellsParam => {
    return cellsParam.map(row =>
      row.map(cell => {
        if (cell.value === -1) {
          return {
            ...cell,
            state: 1
          };
        }

        return cell;
      })
    );
  };

  const openMultiple = (cellsParam, rowParam, colParam) => {
    // open current cell first
    let newCells = setCellProp(cellsParam, rowParam, colParam, "state", 1);

    const topLeftCell =
      rowParam > 0 && colParam > 0
        ? cellsParam[rowParam - 1][colParam - 1]
        : null;
    const topCell = rowParam > 0 ? cellsParam[rowParam - 1][colParam] : null;
    const topRightCell =
      rowParam > 0 && colParam < 8
        ? cellsParam[rowParam - 1][colParam + 1]
        : null;
    const leftCell = colParam > 0 ? cellsParam[rowParam][colParam - 1] : null;
    const rightCell = colParam < 8 ? cellsParam[rowParam][colParam + 1] : null;
    const bottomLeftCell =
      rowParam < 8 && colParam > 0
        ? cellsParam[rowParam + 1][colParam - 1]
        : null;
    const bottomCell = rowParam < 8 ? cellsParam[rowParam + 1][colParam] : null;
    const bottomRightCell =
      rowParam < 8 && colParam < 8
        ? cellsParam[rowParam + 1][colParam + 1]
        : null;

    if (topLeftCell && topLeftCell.state === 0 && topLeftCell.value === 0) {
      newCells = openMultiple(newCells, rowParam - 1, colParam - 1);
    } else if (
      topLeftCell &&
      topLeftCell.state === 0 &&
      topLeftCell.value > 0
    ) {
      newCells = setCellProp(newCells, rowParam - 1, colParam - 1, "state", 1);
    }

    if (topCell && topCell.state === 0 && topCell.value === 0) {
      newCells = openMultiple(newCells, rowParam - 1, colParam);
    } else if (topCell && topCell.value > 0) {
      newCells = setCellProp(newCells, rowParam - 1, colParam, "state", 1);
    }

    if (topRightCell && topCell.state === 0 && topRightCell.value === 0) {
      newCells = openMultiple(newCells, rowParam - 1, colParam + 1);
    } else if (topRightCell && topRightCell.value > 0) {
      newCells = setCellProp(newCells, rowParam - 1, colParam + 1, "state", 1);
    }

    if (leftCell && leftCell.state === 0 && leftCell.value === 0) {
      newCells = openMultiple(newCells, rowParam, colParam - 1);
    } else if (leftCell && leftCell.state === 0 && leftCell.value > 0) {
      newCells = setCellProp(newCells, rowParam, colParam - 1, "state", 1);
    }

    if (rightCell && rightCell.state === 0 && rightCell.value === 0) {
      newCells = openMultiple(newCells, rowParam, colParam + 1);
    } else if (rightCell && rightCell.state === 0 && rightCell.value > 0) {
      newCells = setCellProp(newCells, rowParam, colParam + 1, "state", 1);
    }

    if (
      bottomLeftCell &&
      bottomLeftCell.state === 0 &&
      bottomLeftCell.value === 0
    ) {
      newCells = openMultiple(newCells, rowParam + 1, colParam - 1);
    } else if (
      bottomLeftCell &&
      bottomLeftCell.state === 0 &&
      bottomLeftCell.value > 0
    ) {
      newCells = setCellProp(newCells, rowParam + 1, colParam - 1, "state", 1);
    }

    if (bottomCell && bottomCell.state === 0 && bottomCell.value === 0) {
      newCells = openMultiple(newCells, rowParam + 1, colParam);
    } else if (bottomCell && bottomCell.state === 0 && bottomCell.value > 0) {
      newCells = setCellProp(newCells, rowParam + 1, colParam, "state", 1);
    }

    if (
      bottomRightCell &&
      bottomRightCell.state === 0 &&
      bottomRightCell.value === 0
    ) {
      newCells = openMultiple(newCells, rowParam + 1, colParam + 1);
    } else if (
      bottomRightCell &&
      bottomRightCell.state === 0 &&
      bottomRightCell.value > 0
    ) {
      newCells = setCellProp(newCells, rowParam + 1, colParam + 1, "state", 1);
    }

    return newCells;
  };

  return (
    <div className="App">
      <div className="Header">
        <NumberDisplay value={mineCounter} />
        <div className="Face" onClick={handleFaceClick}>
          <span role="img" aria-label="smiley">
            {face}
          </span>
        </div>
        <NumberDisplay value={time} />
      </div>
      <div className="Body">{renderRows()}</div>
    </div>
  );
};

export default App;
