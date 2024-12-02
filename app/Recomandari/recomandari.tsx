import { useGlobalContextCrop } from '../providers/culturaStore';
import { useEffect, useState } from 'react';

export default function useRecommendations(nitrogenBalance, cropId) {
  const { SinglePage, singleCrop } = useGlobalContextCrop();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  
  useEffect(() => {
    SinglePage(cropId);
  }, [cropId]);

  useEffect(() => {
    if (singleCrop) {
      const newRecommendations: string[] = [];

      // Handle nitrogen balance
      newRecommendations.push(
        nitrogenBalance < singleCrop.nitrogenDemand - 50
          ? 'Nivelul azotului este scăzut. Este recomandat să folosiți un îngrășământ bogat în azot. Mai este nevoie de ' + (singleCrop.nitrogenDemand - nitrogenBalance) + ' unitati'
          : nitrogenBalance < singleCrop.nitrogenDemand
          ? 'Nivelul azotului este moderat. Este recomandat să continuați cu practicile curente de fertilizare. Mai este nevoie de ' + (singleCrop.nitrogenDemand - nitrogenBalance) + ' unitati'
          : 'Nivelul azotului este ridicat. Este recomandat să reduceți utilizarea de îngrășăminte cu azot.'
      );

      // Handle crop type
      switch (singleCrop.cropType) {
        case 'Cereală':
          newRecommendations.push(
            'Culturile de cereale pot beneficia de îngrășăminte fosfatate pentru a îmbunătăți randamentul recoltei.'
          );
          break;
        case 'Leguminoasă':
          newRecommendations.push(
            'Culturile de leguminoase pot beneficia de inoculare cu bacterii fixatoare de azot pentru a îmbunătăți randamentul recoltei.'
          );
          break;
        case 'Fruct':
          newRecommendations.push(
            'Culturile de fructe pot beneficia de îngrășăminte bogate în potasiu pentru a îmbunătăți calitatea fructelor.'
          );
          break;
        default:
          newRecommendations.push('Încă nu avem informații despre această cultură.');
          break;
      }

      setRecommendations(newRecommendations);
    }
  }, [singleCrop, nitrogenBalance, cropId]);

  return recommendations;
}