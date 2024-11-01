const CropCard = ({ crop, onSelect, isSelected }) => {
    return (
      <div className={`
        relative bg-white rounded-xl shadow-sm border transition-all duration-200
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
      `}>
        {crop.imageUrl && (
          <div className="aspect-w-16 aspect-h-9 rounded-t-xl overflow-hidden">
            <img
              src={crop.imageUrl}
              alt={crop.cropName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{crop.cropName}</h3>
              <p className="text-sm text-gray-500">{crop.cropType} • {crop.cropVariety}</p>
            </div>
            {isSelected && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Selected
              </span>
            )}
          </div>
  
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Planting Date:</span>
              <span className="text-gray-900">{new Date(crop.plantingDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Harvesting Date:</span>
              <span className="text-gray-900">{new Date(crop.harvestingDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Soil Type:</span>
              <span className="text-gray-900">{crop.soilType}</span>
            </div>
          </div>
  
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(crop.nitrogenSupply / crop.nitrogenDemand) * 100}%` }}
                />
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {Math.round((crop.nitrogenSupply / crop.nitrogenDemand) * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-500">Nitrogen Balance</p>
          </div>
  
          <div className="mt-4 flex justify-between gap-2">
            <button
              onClick={() => onSelect(crop)}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-lg
                ${isSelected 
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
              `}
            >
              {isSelected ? 'Selected' : 'Select Crop'}
            </button>
            <button
              onClick={() => window.location.href = `/Crud/GetAllInRotatie/SinglePag?crop=${crop._id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default CropCard;