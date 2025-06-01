import React, { useRef } from 'react';
import { Teacher, MonthlyTeacherSalaryData, PayslipFieldMapping } from '../../types';
import { PrinterIcon } from '../icons/FeatureIcons';
import { getValueFromRow } from '../../utils/payslipUtils'; // Import from new utility file

interface PayslipDisplayProps {
  teacher: Teacher;
  salaryData: MonthlyTeacherSalaryData;
  mappings: PayslipFieldMapping[];
  targetMonth: string;
  targetYear: string;
}

const parseNumericValue = (value: any): number => {
  if (value === null || value === undefined || String(value).trim() === '') return 0;
  const num = parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? 0 : num;
};

const formatAmount = (value: any): string => {
  const num = parseNumericValue(value);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const numberToWords = (num: number): string => {
    if (num === 0) return "Zero";

    const integerPartAbs = Math.floor(Math.abs(num));
    if (integerPartAbs === 0) return ""; 

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

    let words = "";
    let currentNum = integerPartAbs;
    let i = 0;

    while (currentNum > 0) {
        if (currentNum % 1000 !== 0) {
            words = convertLessThanOneThousand(currentNum % 1000) + (thousands[i] ? " " + thousands[i] : "") + (words ? " " + words : "");
        }
        currentNum = Math.floor(currentNum / 1000);
        i++;
    }
    
    return words.trim();

    function convertLessThanOneThousand(n: number): string {
        let currentWords = "";
        if (n >= 100) {
            currentWords += ones[Math.floor(n / 100)] + " Hundred";
            n %= 100;
            if (n > 0) currentWords += " ";
        }
        if (n >= 20) {
            currentWords += tens[Math.floor(n / 10)];
            n %= 10;
             if (n > 0) currentWords += " ";
        }
        if (n > 0) {
            currentWords += ones[n];
        }
        return currentWords.trim();
    }
};


export const PayslipDisplay: React.FC<PayslipDisplayProps> = ({ teacher, salaryData, mappings, targetMonth, targetYear }) => {
  const payslipPrintAreaRef = useRef<HTMLDivElement>(null);

  const getMappedValue = (mapping: PayslipFieldMapping): string | number | null => {
    if (mapping.valueKey && teacher[mapping.valueKey]) {
        const val = teacher[mapping.valueKey];
        if (typeof val === 'string' || typeof val === 'number') return val;
    }
    return getValueFromRow(salaryData.rawHeaders, salaryData.rawDataRow, mapping.excelHeaderCandidates);
  };

  const headerDataElements: { label: string, value: string }[] = [];
  const payslipHeaderFields = [
    "NAME OF SCHOOL", "SCHOOL SHALARTH DDO CODE", "EMPLOYEE NAME", "SHALARTH ID",
    "GPF NO", "PAN NO", "PRAN NO", "ADHAR NO", "EMAIL ID", "MOB NO",
    "BANK ACCOUNT NUMBER", "PAY MATRIX", "BANK IFSC CODE", "BRANCH NAME"
  ];

  payslipHeaderFields.forEach(fieldLabel => {
    const mapping = mappings.find(m => m.payslipLabel === fieldLabel && m.category === 'headerInfo');
    let valueToDisplay = 'N/A';
    if (mapping) {
        let value = null;
        // Prioritize salaryData for name/shalarthID, fallback to teacher object
        if (fieldLabel === "EMPLOYEE NAME") {
             value = getMappedValue(mapping) || teacher.name;
        } else if (fieldLabel === "SHALARTH ID") {
            value = getMappedValue(mapping) || teacher.shalarthId;
        } else {
            value = getMappedValue(mapping);
        }
        
        if (value !== null && String(value).trim() !== '') {
            valueToDisplay = String(value);
        }
    } else if (fieldLabel === "EMPLOYEE NAME" && teacher.name) { 
        valueToDisplay = teacher.name;
    } else if (fieldLabel === "SHALARTH ID" && teacher.shalarthId) {
        valueToDisplay = teacher.shalarthId;
    }


    // School name is not part of the compact header items, but fetched for use elsewhere if needed
    if (fieldLabel !== "NAME OF SCHOOL") {
        headerDataElements.push({ label: fieldLabel, value: valueToDisplay });
    }
  });


  const emolumentsList: { label: string, value: number }[] = [];
  const govtRecoveriesList: { label: string, value: number }[] = [];
  const nonGovtRecoveriesList: { label: string, value: number }[] = [];

  mappings.forEach(m => {
    if (m.category === 'emolument' || m.category === 'govtRecovery' || m.category === 'nonGovtRecovery') {
        const rawValue = getMappedValue(m);
        const numericValue = parseNumericValue(rawValue);

        if (numericValue !== 0) { 
            const item = { label: m.payslipLabel, value: numericValue };
            if (m.category === 'emolument') emolumentsList.push(item);
            else if (m.category === 'govtRecovery') govtRecoveriesList.push(item);
            else if (m.category === 'nonGovtRecovery') nonGovtRecoveriesList.push(item);
        }
    }
  });

  const totalEmoluments = emolumentsList.reduce((sum, item) => sum + item.value, 0);
  const totalGovtRecoveries = govtRecoveriesList.reduce((sum, item) => sum + item.value, 0);
  const totalNonGovtRecoveries = nonGovtRecoveriesList.reduce((sum, item) => sum + item.value, 0);
  const grandTotalDeductions = totalGovtRecoveries + totalNonGovtRecoveries;
  
  const netPayExcelMapping = mappings.find(m => m.payslipLabel === "EMPLOYEE NET SALARY");
  let netPayFromExcel: string | number | null = null;
  if (netPayExcelMapping) {
    netPayFromExcel = getMappedValue(netPayExcelMapping);
  }
  const finalNetPay = parseNumericValue(netPayFromExcel); 
  const netPayWords = numberToWords(finalNetPay);


  const handlePrintPayslip = () => {
    const payslipElement = payslipPrintAreaRef.current;
    if (!payslipElement) {
      alert("Could not find payslip content to print.");
      return;
    }

    let payslipContentHTML = payslipElement.innerHTML;
    
    const escapeBackticks = (str: string) => str.replace(/`/g, '\\`');
    const safeTargetMonth = escapeBackticks(targetMonth);
    const safeTargetYear = escapeBackticks(targetYear);
    const safeTeacherName = escapeBackticks(teacher.name || "Teacher"); // Use "Teacher" if name is somehow undefined
    const printTitle = `Payslip - ${safeTargetMonth} ${safeTargetYear} - ${safeTeacherName}`;

    payslipContentHTML = escapeBackticks(payslipContentHTML);

    // Comprehensive print styles based on payslip_template.html
    const payslipPrintStyles = `
        @page { 
          size: A4 portrait; 
          margin: 8mm; 
        }
        body { 
          font-family: Arial, sans-serif !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: white !important;
          color: black !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-size: 8.5pt !important; 
          line-height: 1.3 !important; 
        }
        .printable-payslip-popup-wrapper {
            /* Wrapper for the content in the popup */
        }
        .printable-payslip { 
          margin: 0 auto !important; 
          padding: 10px !important; 
          border: 0.5pt solid #555 !important; 
          box-shadow: none !important; 
          width: 100% !important; 
          max-width: 194mm !important; /* A4 width - 2*8mm margin */
          background-color: white !important;
          color: black !important;
        }
        .printable-payslip div, 
        .printable-payslip span, 
        .printable-payslip p, 
        .printable-payslip th, 
        .printable-payslip td, 
        .printable-payslip h4, 
        .printable-payslip h5, 
        .printable-payslip hr {
          background-color: transparent !important;
          color: black !important;
          border-color: #777 !important; 
        }
        .printable-payslip .action-buttons { display: none !important; } /* Hide print button on print */
        .printable-payslip .no-print-in-popup { display: none !important; }

        /* Main Header */
        .payslip-main-header {
            text-align: center !important;
            margin-bottom: 8px !important;
        }
        .payslip-main-header h4 { /* SALARY SLIP */
            font-size: 14pt !important; 
            font-weight: bold !important;
            margin: 0 0 3px 0 !important;
        }
        .payslip-main-header .sub-header-month-year { 
            font-size: 11pt !important;
            font-weight: bold !important;
            margin: 0 0 8px 0 !important;
        }

        /* Employee Info Header */
        .employee-info-header {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 2px 10px !important; 
            margin-bottom: 8px !important;
            font-size: 8pt !important; 
        }
        .employee-info-header > div { 
            display: flex !important;
            line-height: 1.2 !important;
        }
        .employee-info-header .font-medium { 
            font-weight: bold !important;
            min-width: 100px !important; /* Fixed width for labels */
            padding-right: 4px !important;
        }
        .employee-info-header .break-words { 
            flex-grow: 1;
        }
        
        hr.section-divider { 
            border: none !important;
            border-top: 0.5pt solid #777 !important;
            margin: 8px 0 !important;
        }

        /* Salary Details Grid (Emoluments, Recoveries) */
        .salary-details-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0px !important; 
            font-size: 8pt !important; 
            border: 0.5pt solid #777 !important; 
            margin-bottom: 8px !important; 
        }
        .salary-details-grid > div { 
            padding: 5px !important; 
        }
        .salary-details-grid > div:not(:last-child) {
             border-right: 0.5pt solid #777 !important;
        }

        .salary-column-title h5 {
             font-size: 9pt !important; 
             font-weight: bold !important;
             text-align: center !important;
             margin-top: 0 !important;
             margin-bottom: 5px !important;
             text-decoration: underline !important;
        }

        .salary-item-row {
            display: flex !important;
            justify-content: space-between !important;
            margin-bottom: 2px !important; /* Reduced margin */
            line-height: 1.2 !important;
        }
        .salary-item-row > span:first-child { 
            word-break: break-word !important;
            padding-right: 3px !important;
        }
        .salary-item-row > span:last-child { 
            font-family: 'Courier New', Courier, monospace !important; 
            white-space: nowrap !important;
            text-align: right !important;
        }
        
        hr.column-totals-hr {
            border: none !important;
            border-top: 0.5pt solid #999 !important;
            margin: 4px 0 !important;
        }
        .column-total-row {
            display: flex !important;
            justify-content: space-between !important;
            font-weight: bold !important;
            margin-top: 3px !important;
            font-size: 8pt !important;
        }
         .column-total-row > span:last-child { 
            font-family: 'Courier New', Courier, monospace !important;
         }

        /* Net Pay Section */
        .net-pay-summary {
             text-align: center !important;
             margin-top: 10px !important;
             font-size: 9pt !important; 
        }
        .total-deductions-line { 
            font-size: 9pt !important; 
            margin-bottom: 3px !important; 
        }
        .total-deductions-line .font-mono {
            font-family: 'Courier New', Courier, monospace !important;
            font-weight: bold !important;
        }
        .net-pay-summary p.font-bold { 
             font-size: 10pt !important; 
             font-weight: bold !important;
             margin: 3px 0 !important;
        }
        .net-pay-summary p.font-bold .font-mono { 
            font-family: 'Courier New', Courier, monospace !important;
        }
        .net-pay-summary p:last-child { 
            font-size: 8pt !important; 
            font-style: italic !important;
            margin-top: 2px !important;
        }

        /* Footer */
        .payslip-final-footer {
            text-align: center !important;
            margin-top: 15px !important;
            font-size: 7.5pt !important; 
            font-style: italic !important;
        }
        
        /* Ensure specific Tailwind utilities are overridden if necessary */
        .printable-payslip .text-\\[9px\\] { font-size: 8pt !important; } 
        .printable-payslip .text-\\[8px\\] { font-size: 7pt !important; } 
        .printable-payslip .sm\\:text-\\[10px\\] { font-size: 8pt !important; }
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>${printTitle}</title>
            <style>
              ${payslipPrintStyles}
            </style>
          </head>
          <body>
            <div class="printable-payslip-popup-wrapper">
              ${payslipContentHTML}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();

      const script = printWindow.document.createElement('script');
      script.type = 'text/javascript';
      script.textContent = 'window.onload = function() { setTimeout(function() { window.print(); setTimeout(function() { window.close(); }, 150); }, 100); };';
      
      if (printWindow.document.body) {
        printWindow.document.body.appendChild(script);
      } else {
        printWindow.document.addEventListener('DOMContentLoaded', () => {
          if(printWindow.document.body) {
            printWindow.document.body.appendChild(script);
          } else { 
            console.error("Print window body not found even after DOMContentLoaded."); 
            alert("Failed to initialize print script."); 
          }
        });
      }
    } else {
      alert("Could not open print window. Please check your browser's pop-up settings.");
    }
  };
  
  const renderHeaderItem = (label: string, value: string) => (
    <div className="flex text-[8px] sm:text-[9px] leading-tight">
      <span className="font-medium w-2/5 pr-1">{label}:</span>
      <span className="w-3/5 break-words">{value}</span>
    </div>
  );
  
  const renderThreeColumnSectionItem = (item: {label: string, value: number}) => {
    return (
      <div key={item.label} className="salary-item-row text-[8px] sm:text-[9px] mb-px">
        <span className="pr-0.5 break-words max-w-[70%]">{item.label}:</span>
        <span className="font-mono whitespace-nowrap text-right">{formatAmount(item.value)}</span>
      </div>
    );
  };
  
  const maxRows = Math.max(emolumentsList.length, govtRecoveriesList.length, nonGovtRecoveriesList.length);

  const designationMapping = mappings.find(m => m.payslipLabel === "DESIGNATION");
  let designationValue = teacher.designation || 'N/A'; 
  if (designationMapping) {
    const excelDesignation = getMappedValue(designationMapping);
    if (excelDesignation !== null && String(excelDesignation).trim() !== '') {
      designationValue = String(excelDesignation);
    }
  }
  
  const shalarthIdIndex = headerDataElements.findIndex(item => item.label === "SHALARTH ID");
  const headerPart1 = headerDataElements.slice(0, shalarthIdIndex + 1);
  const headerPart2 = headerDataElements.slice(shalarthIdIndex + 1);


  return (
    // Main container for the component, includes the print button (which is hidden on print)
    <div className="w-full">
        <div ref={payslipPrintAreaRef} className="bg-white text-black p-1.5 sm:p-2 border border-gray-400 shadow-lg printable-payslip max-w-2xl mx-auto font-sans">
            <div className="text-center mb-1 payslip-main-header">
                <h4 className="font-bold text-base sm:text-lg">SALARY SLIP</h4>
                <div className="sub-header-month-year text-xs sm:text-sm font-semibold">PAYSLIP for {targetMonth.toUpperCase()}-{targetYear}</div>
            </div>

            <div className="grid grid-cols-2 gap-x-1.5 mb-0.5 employee-info-header">
                {headerPart1.map(item => renderHeaderItem(item.label, item.value))}
                {renderHeaderItem("Designation", designationValue)}
                {headerPart2.map(item => renderHeaderItem(item.label, item.value))}
            </div>
            
            <hr className="section-divider border-gray-300 my-0.5" />

            <div className="grid grid-cols-3 gap-x-0 salary-details-grid">
                <div className="px-0.5 py-1"> 
                    <div className="salary-column-title">
                        <h5 className="font-semibold text-center text-[9px] sm:text-xs mb-0.5 underline">Emoluments</h5>
                    </div>
                    {emolumentsList.map(item => renderThreeColumnSectionItem(item))}
                    {Array.from({ length: Math.max(0, maxRows - emolumentsList.length) }).map((_, idx) => 
                        <div key={'emolument-fill-' + idx} className="text-[8px] sm:text-[9px] mb-px h-[1.1em]">&nbsp;</div> 
                    )}
                    <hr className="border-gray-300 my-0.5 column-totals-hr" />
                    <div className="column-total-row text-[8px] sm:text-[9px] font-medium">
                        <span>Total Emoluments:</span>
                        <span className="font-mono text-right">{formatAmount(totalEmoluments)}</span>
                    </div>
                </div>

                <div className="px-0.5 py-1"> 
                    <div className="salary-column-title">
                        <h5 className="font-semibold text-center text-[9px] sm:text-xs mb-0.5 underline">Govt. Recoveries</h5>
                    </div>
                    {govtRecoveriesList.map(item => renderThreeColumnSectionItem(item))}
                    {Array.from({ length: Math.max(0, maxRows - govtRecoveriesList.length) }).map((_, idx) => 
                        <div key={'govtrec-fill-' + idx} className="text-[8px] sm:text-[9px] mb-px h-[1.1em]">&nbsp;</div>
                    )}
                    <hr className="border-gray-300 my-0.5 column-totals-hr" />
                    <div className="column-total-row text-[8px] sm:text-[9px] font-medium">
                        <span>Total Govt. Recov.:</span>
                        <span className="font-mono text-right">{formatAmount(totalGovtRecoveries)}</span>
                    </div>
                </div>

                <div className="px-0.5 py-1"> 
                    <div className="salary-column-title">
                        <h5 className="font-semibold text-center text-[9px] sm:text-xs mb-0.5 underline">Non Govt. Recoveries</h5>
                    </div>
                    {nonGovtRecoveriesList.map(item => renderThreeColumnSectionItem(item))}
                    {Array.from({ length: Math.max(0, maxRows - nonGovtRecoveriesList.length) }).map((_, idx) => 
                        <div key={'nongovtrec-fill-' + idx} className="text-[8px] sm:text-[9px] mb-px h-[1.1em]">&nbsp;</div>
                    )}
                    <hr className="border-gray-300 my-0.5 column-totals-hr" />
                    <div className="column-total-row text-[8px] sm:text-[9px] font-medium">
                        <span>Total Non-Govt. Recov.:</span>
                        <span className="font-mono text-right">{formatAmount(totalNonGovtRecoveries)}</span>
                    </div>
                </div>
            </div>
            
            <hr className="section-divider border-gray-300 my-0.5" />

            <div className="mt-0.5 text-center net-pay-summary">
                <div className="total-deductions-line text-[9px] sm:text-xs">Total Deductions: <span className="font-mono">{formatAmount(grandTotalDeductions)}</span></div>
                <p className="font-bold text-xs sm:text-[10px]">NET PAY: <span className="font-mono">{formatAmount(finalNetPay)}</span></p>
                {netPayWords && (
                    <p className="text-[7px] sm:text-[8px] font-medium">({netPayWords} Rs. Only.)</p>
                )}
            </div>
            
            <p className="text-center text-[7px] sm:text-[8px] italic mt-0.5 payslip-final-footer">*This is a system-generated payslip. Hence signature is not needed.*</p>
        </div>
        
        {/* Print button is outside the 'payslipPrintAreaRef' div if we want to avoid copying its HTML for the popup. */}
        {/* However, it's simpler to keep it part of the component and hide it with CSS in the print popup. */}
        <div className="mt-3 text-center action-buttons no-print"> {/* Added no-print here as well for general print scenarios */}
            <button 
            onClick={handlePrintPayslip}
            className="py-1.5 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center justify-center mx-auto"
            aria-label="Print Payslip Statement"
            >
            <PrinterIcon className="w-4 h-4 mr-1.5"/> Print Statement
            </button>
        </div>
    </div>
  );
};
