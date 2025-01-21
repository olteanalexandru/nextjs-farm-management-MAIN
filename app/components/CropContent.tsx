import { Crop } from '../types/api';

interface CropContentProps {
    crop: Crop;
}

export function CropContent({ crop }: CropContentProps) {
    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{crop.cropName}</h3>
            <div className="space-y-2">
                <p className="text-sm text-gray-600">Type: {crop.cropType}</p>
                {crop.cropVariety && (
                    <p className="text-sm text-gray-600">Variety: {crop.cropVariety}</p>
                )}
                {crop.plantingDate && (
                    <p className="text-sm text-gray-600">
                        Planting Date: {new Date(crop.plantingDate).toLocaleDateString()}
                    </p>
                )}
                {crop.harvestingDate && (
                    <p className="text-sm text-gray-600">
                        Harvest Date: {new Date(crop.harvestingDate).toLocaleDateString()}
                    </p>
                )}
                <p className="text-sm text-gray-600">
                    Nitrogen Balance: {Number(crop.nitrogenDemand) - Number(crop.nitrogenSupply)}
                </p>
            </div>
        </div>
    );
}
