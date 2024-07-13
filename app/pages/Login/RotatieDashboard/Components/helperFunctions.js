export const getCropsRepeatedBySelection = (crops, selections) => {
    let uniqueId = 0; // Initialize a unique ID counter
    return selections
      .map(selection => ({
        count: selection.selectionCount,
        cropId: selection.crop
      }))
      .flatMap(({ count, cropId }) => {
        const crop = crops.find(crop => crop._id === cropId);
        // Create an array with unique objects containing the crop and a unique ID
        return Array.from({ length: count }, () => ({ ...crop, uniqueId: uniqueId++ }));
      });
  };
  
  export const prepareChartData = (rotationPlan, numberOfDivisions) => {
    let chartData = [];
    let previousYearData = {};
    rotationPlan.forEach(yearPlan => {
      let yearData = { year: yearPlan.year };
      yearPlan.rotationItems.forEach(item => {
        yearData[`Parcela${item.division}`] = item.nitrogenBalance;
      });
  
      // Add missing divisions from the previous year
      for (let division = 1; division <= numberOfDivisions; division++) {
        const key = `Parcela ${division}`;
        if (!(key in yearData) && (key in previousYearData)) {
          yearData[key] = previousYearData[key];
        }
      }
      chartData.push(yearData);
      previousYearData = yearData;
    });
    return chartData;
  };
  