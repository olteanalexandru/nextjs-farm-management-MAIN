export const getCropsRepeatedBySelection = (crops, selections) => {
    if (!Array.isArray(selections) || !Array.isArray(crops)) {
        console.log('Invalid input:', { crops, selections });
        return [];
    }

    let uniqueId = 0;
    const repeatedCrops = selections
        .filter(selection => selection.selectionCount > 0)  // Only include selected crops
        .map(selection => ({
            count: selection.selectionCount,
            cropId: selection.cropId
        }))
        .flatMap(({ count, cropId }) => {
            const crop = crops.find(crop => crop.id === cropId || crop._id === cropId);
            if (!crop) {
                console.log('Crop not found for id:', cropId);
                return [];
            }
            return Array.from({ length: count }, () => ({
                ...crop,
                uniqueId: uniqueId++,
                _id: crop.id || crop._id,
                id: crop.id || crop._id
            }));
        });

    console.log('Repeated crops:', repeatedCrops);
    return repeatedCrops;
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
