import { Table } from 'react-bootstrap';
import { useTranslations } from 'next-intl';

interface RotationDetailsProps {
  rotation: {
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
  };
  planIndex: number;
  divisionSizeValues: string[];
  nitrogenBalanceValues: string[];
  onDivisionSizeChange: (index: number, value: string) => void;
  onNitrogenBalanceChange: (index: number, value: string) => void;
  onDivisionSizeSubmit: (value: number, division: string) => void;
  onNitrogenBalanceSubmit: (value: number, year: number, division: string) => void;
  onDelete: () => void;
}

const RotationDetails = ({
  rotation,
  planIndex,
  divisionSizeValues,
  nitrogenBalanceValues,
  onDivisionSizeChange,
  onNitrogenBalanceChange,
  onDivisionSizeSubmit,
  onNitrogenBalanceSubmit,
  onDelete
}: RotationDetailsProps) => {
  const t = useTranslations('RotatieDashboard');

  if (!rotation || !rotation.rotationPlans || rotation.rotationPlans.length === 0) {
    return <div>No rotation details available</div>;
  }

  // Group rotation plans by year
  const plansByYear = rotation.rotationPlans.reduce((acc, plan) => {
    if (!acc[plan.year]) {
      acc[plan.year] = [];
    }
    acc[plan.year].push(plan);
    return acc;
  }, {} as Record<number, typeof rotation.rotationPlans>);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">{rotation.rotationName}</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Field Size:</span> {rotation.fieldSize} ha
          </div>
          <div>
            <span className="font-medium">Number of Divisions:</span> {rotation.numberOfDivisions}
          </div>
        </div>
      </div>

      {Object.entries(plansByYear).map(([year, plans]) => (
        <div key={year} className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">{t('anul')} {year}</h3>
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
              {plans.sort((a, b) => a.division - b.division).map((plan, index) => (
                <tr key={`${plan.year}-${plan.division}`}>
                  <td>{plan.division}</td>
                  <td>{plan.crop.cropName}</td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      value={divisionSizeValues[index] || plan.divisionSize}
                      onChange={(e) => onDivisionSizeChange(index, e.target.value)}
                      onBlur={() => onDivisionSizeSubmit(
                        parseFloat(divisionSizeValues[index] || plan.divisionSize.toString()),
                        plan.division.toString()
                      )}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      value={nitrogenBalanceValues[index] || plan.nitrogenBalance}
                      onChange={(e) => onNitrogenBalanceChange(index, e.target.value)}
                      onBlur={() => onNitrogenBalanceSubmit(
                        parseFloat(nitrogenBalanceValues[index] || plan.nitrogenBalance.toString()),
                        plan.year,
                        plan.division.toString()
                      )}
                    />
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
              ))}
            </tbody>
          </Table>
        </div>
      ))}
    </div>
  );
};

export default RotationDetails;
