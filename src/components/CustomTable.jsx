import React from "react";
import Loader from "./Loader";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";

const CustomTable = ({
  data,
  columns,
  lastPage = 1,
  page = 1,
  handlePageChange,
  className = "",
  loading = false,
  loadingHeight = "100%",
  rowClickable = false,
  onRowClick,
  minWidth = "1000px",
  pagination = true,
  style = {},
}) => {
  const getColumnWidths = (columns) => {
    let usedWidth = 0;
    const autoColumns = [];

    columns.forEach((col) => {
      if (col.width) {
        usedWidth += parseFloat(col.width);
      } else {
        autoColumns.push(col);
      }
    });

    const remainingWidth = Math.max(100 - usedWidth, 0);
    const autoWidth =
      autoColumns.length > 0 ? remainingWidth / autoColumns.length : 0;

    return columns.map((col) => ({
      ...col,
      _calculatedWidth: col.width || `${autoWidth}%`,
    }));
  };

  const finalColumns = getColumnWidths(columns);

  return (
    <>
      <div style={style} className={`custom-table-wrapper ${className}`}>
        <table style={{ minWidth }} className="custom-table">
          <colgroup>
            {finalColumns.map((col, i) => (
              <col key={i} style={{ width: col._calculatedWidth }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`${col.bothClass || ""} ${col.thClass || ""}`}
                  style={{ ...col.bothStyle, ...col.thStyle }}
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          {loading ? (
            <tbody>
              <tr>
                <td colSpan={columns.length} className="no-data-cell">
                  <Loader size="60" style={{ height: loadingHeight }} />
                </td>
              </tr>
            </tbody>
          ) : data?.length > 0 ? (
            <tbody>
              {data?.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(row)}
                  style={{ cursor: rowClickable ? "pointer" : "" }}
                >
                  {columns.map((col, i) => (
                    <td
                      className={`${col.bothClass || ""} ${col.tdClass || ""}`}
                      style={{ ...col.bothStyle, ...col.tdStyle }}
                      key={i}
                    >
                      {typeof col.row === "function"
                        ? col.row(row)
                        : row[col.row]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody>
              <tr>
                <td colSpan={columns.length} className="no-data-cell">
                  No data found.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
      {pagination && (
        <div className="custom-table-pagination-container">
          <div className="custom-table-pagination-btn-container">
            <button
              className="custom-table-pagination-btn"
              disabled={page === 1}
              onClick={() => handlePageChange(1)}
            >
              <ChevronFirst />
            </button>
            <button
              className="custom-table-pagination-btn"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft />
            </button>
          </div>
          <span className="custom-table-pagination-content">
            Page {page} of {lastPage}
          </span>
          <div className="custom-table-pagination-btn-container">
            <button
              className="custom-table-pagination-btn"
              disabled={page === lastPage}
              onClick={() => handlePageChange(page + 1)}
            >
              <ChevronRight />
            </button>
            <button
              className="custom-table-pagination-btn"
              disabled={page === lastPage}
              onClick={() => handlePageChange(lastPage)}
            >
              <ChevronLast />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomTable;
