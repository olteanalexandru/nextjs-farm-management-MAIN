import { Table, Spinner, Alert } from 'react-bootstrap';
import { useTranslations } from 'next-intl';

interface RotationData {
  rotationName: string;
  fieldSize: number;
  numberOfDivisions: number;
  rotationPlans: Array<{
    year: number;
    division: number;
    crop: {
      cropName: string;
    };
    divisionSize: number | string;
    nitrogenBalance: number | string;
  }>;
}

interface RotationDetailsProps {
  rotation: RotationData;
  planIndex: number;
  divisionSizeValues: string[];
  nitrogenBalanceMap: { [key: string]: string }; // Changed from array to map
  onDivisionSizeChange: (index: number, value: string) => void;
  onNitrogenBalanceChange: (year: number, division: number, value: string) => void; // Modified signature
  onDivisionSizeSubmit: (value: number, division: string) => void;
  onNitrogenBalanceSubmit: (value: number, year: number, division: string) => void;
  onDelete: () => void;
  isUpdating: boolean;
}

export default function RotationDetails({
  rotation,
  divisionSizeValues,
  nitrogenBalanceMap,
  onDivisionSizeChange,
  onNitrogenBalanceChange,
  onDivisionSizeSubmit,
  onNitrogenBalanceSubmit,
  onDelete,
  isUpdating
}: RotationDetailsProps) {
  const t = useTranslations('RotatieDashboard');

  if (!rotation) {
    return <Alert variant="warning">{t('No rotation details available')}</Alert>;
  }

  if (!rotation.rotationPlans || rotation.rotationPlans.length === 0) {
    return <Alert variant="info">{t('No rotation plans available')}</Alert>;
  }

  // Group rotation plans by year
  const plansByYear = rotation.rotationPlans.reduce((acc, plan) => {
    if (!acc[plan.year]) {
      acc[plan.year] = [];
    }
    acc[plan.year].push(plan);
    return acc;
  }, {} as Record<number, typeof rotation.rotationPlans>);

  // Add handlers for form submission
  const handleDivisionSizeSubmit = (index: number, division: string) => {
    const value = parseFloat(divisionSizeValues[index]);
    if (!isNaN(value)) {
      onDivisionSizeSubmit(value, division);
    }
  };

  const handleNitrogenBalanceSubmit = (index: number, year: number, division: string) => {
    const value = parseFloat(nitrogenBalanceMap[`${year}-${division}`]);
    if (!isNaN(value)) {
      onNitrogenBalanceSubmit(value, year, division);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">{rotation.rotationName}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">{t('Field Size')}:</span> {rotation.fieldSize} ha
          </div>
          <div>
            <span className="font-medium">{t('Number of Divisions')}:</span> {rotation.numberOfDivisions}
          </div>
        </div>
      </div>

      {Object.entries(plansByYear).map(([year, plans]) => (
        <div key={year} className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">
            {t('anul')} {year}
            {parseInt(year) > Math.min(...Object.keys(plansByYear).map(Number)) && (
              <span className="text-sm text-gray-500 ml-2">
                (Values will be recalculated for following years)
              </span>
            )}
          </h3>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>{t('division')}</th>
                <th>{t('crop')}</th>
                <th>{t('divisionSize')} (ha)</th>
                <th>{t('nitrogenBalance')} (kg/ha)</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {plans.sort((a, b) => a.division - b.division).map((plan, index) => {
                const nitrogenKey = `${plan.year}-${plan.division}`;
                return (
                  <tr key={`${plan.year}-${plan.division}`}>
                    <td>{plan.division}</td>
                    <td>{plan.crop.cropName}</td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          className="form-control"
                          value={divisionSizeValues[index] || plan.divisionSize}
                          onChange={(e) => onDivisionSizeChange(index, e.target.value)}
                          disabled={isUpdating}
                        />
                        <button
                          onClick={() => handleDivisionSizeSubmit(index, plan.division.toString())}
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                          disabled={isUpdating}
                        >
                          Update
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          className="form-control"
                          value={nitrogenBalanceMap[nitrogenKey] || plan.nitrogenBalance}
                          onChange={(e) => onNitrogenBalanceChange(plan.year, plan.division, e.target.value)}
                          disabled={isUpdating}
                        />
                        <button
                          onClick={() => {
                            const value = parseFloat(nitrogenBalanceMap[nitrogenKey]);
                            if (!isNaN(value)) {
                              onNitrogenBalanceSubmit(value, plan.year, plan.division.toString());
                            }
                          }}
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                          disabled={isUpdating}
                        >
                          {parseInt(year) === Math.min(...Object.keys(plansByYear).map(Number)) 
                            ? "Update" 
                            : "Update & Recalculate"}
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={onDelete}
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ))}
      {isUpdating && (
        <div className="text-center py-2 text-gray-600">
          Updating...
        </div>
      )}
    </div>
  );
}
