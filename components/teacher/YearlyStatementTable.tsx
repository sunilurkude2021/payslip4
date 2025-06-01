import React from 'react';
import { StatementDataRow } from './TeacherIncomeTaxPage'; // Import related types

interface YearlyStatementTableProps {
  activeColumns: { statementLabel: string; excelHeader: string }[];
  monthlyRows: StatementDataRow[];
  totalsRow: Record<string, number | string>;
}

const formatAmountForTable = (value: any): string => {
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return '0.00';
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const YearlyStatementTable: React.FC<YearlyStatementTableProps> = ({ 
  activeColumns, 
  monthlyRows, 
  totalsRow 
}) => {
  if (!activeColumns || activeColumns.length === 0 || !monthlyRows || monthlyRows.length === 0) {
    return <p className="text-center text-gray-500 py-4">No data available to display in the statement.</p>;
  }

  return (
    <div className="overflow-x-auto statement-table-wrapper">
      <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th scope="col" className="py-2 px-3 text-left text-xs font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10 border-r border-gray-300">
              Month
            </th>
            {activeColumns.map(col => (
              <th key={col.excelHeader} scope="col" className="py-2 px-3 text-right text-xs font-semibold text-gray-700 whitespace-nowrap">
                {col.statementLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {monthlyRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              <td className="py-2 px-3 text-xs text-gray-700 font-medium sticky left-0 bg-white hover:bg-gray-50 z-10 border-r border-gray-300 whitespace-nowrap">
                {String(row.values.monthDisplay)}
              </td>
              {activeColumns.map(col => (
                <td key={`${rowIndex}-${col.excelHeader}`} className="py-2 px-3 text-xs text-gray-600 text-right whitespace-nowrap font-mono">
                  {formatAmountForTable(row.values[col.excelHeader])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-100 border-t-2 border-gray-400">
          <tr className="total-row">
            <td className="py-2 px-3 text-xs font-bold text-gray-800 sticky left-0 bg-gray-100 z-10 border-r border-gray-300">
              Total
            </td>
            {activeColumns.map(col => (
              <td key={`total-${col.excelHeader}`} className="py-2 px-3 text-xs font-bold text-gray-800 text-right whitespace-nowrap font-mono">
                {formatAmountForTable(totalsRow[col.excelHeader])}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default YearlyStatementTable;
