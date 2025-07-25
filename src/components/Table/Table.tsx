import React from "react";
import { cssVariables } from "../../utils/cssVariables";

type ColumnSpec =
  | string
  | {
      title: string;
      key?: string;
      align?: "left" | "center" | "right";
      monospace?: boolean;
      width?: number;
    };

type HeaderSpec =
  | string
  | {
      title: string;
      colSpan?: number;
      rowSpan?: number;
      width?: number;
    };

type CellValue = string | number;

type DataRow = { [key: string]: CellValue } | CellValue[];

interface Props {
  headers?: HeaderSpec[][];
  columns?: ColumnSpec[];
  data?: DataRow[];
  align?: "left" | "center" | "right";
}

export function Table(props: Props) {
  const { data = [], align = "left" } = props;
  let { columns: colSpec, headers } = props;

  if (!colSpec && headers) {
    colSpec = [];
    for (const header of headers[0]) {
      const colSpan = (typeof header !== "string" && header.colSpan) || 1;
      for (let i = 0; i < colSpan; i++) {
        colSpec.push("Column " + colSpec.length + 1);
      }
    }
  }
  if (!colSpec) {
    throw new Error("Columns or headers must be provided");
  }
  if (!headers) {
    headers = [
      colSpec.map<HeaderSpec>((column) => {
        if (typeof column === "string") column = { title: column };
        return { title: column.title, width: column.width };
      }),
    ];
  }

  const columns = colSpec.map((col, i) => {
    if (typeof col === "string") col = { title: col };
    const key = col.key || col.title?.toLowerCase().replace(/\s+/g, "_") || `col_${i}`;
    return { ...col, key };
  });

  const getCellStyle = (column: ColumnSpec): React.CSSProperties => {
    if (typeof column === "string") column = { title: column };
    return {
      textAlign: column.align || align,
      fontFamily: column.monospace ? cssVariables.fontMonospace : undefined,
      width: column.width,
      whiteSpace: column.width ? "normal" : "nowrap",
    };
  };

  return (
    <table>
      <tbody>
        {headers.map((headerRow, rowIndex) => (
          <tr key={rowIndex}>
            {headerRow.map((headerCell, cellIndex) => {
              if (typeof headerCell === "string") headerCell = { title: headerCell };
              return (
                <th
                  key={cellIndex}
                  colSpan={headerCell.colSpan}
                  rowSpan={headerCell.rowSpan}
                  style={{
                    textAlign: "center",
                    width: headerCell.width,
                    whiteSpace: headerCell.width ? "normal" : "nowrap",
                  }}
                >
                  {headerCell.title}
                </th>
              );
            })}
          </tr>
        ))}
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column, columnIndex) => {
              const cellValue = Array.isArray(row) ? row[columnIndex] : row[column.key];
              return (
                <td key={column.key} style={getCellStyle(column)}>
                  {cellValue}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
