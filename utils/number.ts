
export const formatNumber = (num: number | string | undefined, system: 'latin' | 'arabic' = 'arabic'): string => {
  if (num === undefined || num === null) return '';
  const str = num.toString();
  
  if (system === 'arabic') {
    // Convert Latin to Arabic (Eastern Arabic Numerals)
    return str.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
  } else {
    // Convert Arabic to Latin (Western Arabic Numerals)
    // Also ensures if the input was already Arabic, it gets normalized to Latin 
    // (though in this app inputs are mostly Latin from code/API)
    return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  }
};
