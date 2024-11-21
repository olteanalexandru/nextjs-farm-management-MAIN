import GridGenerator from '@/app/components/GridGen';
import Continut from '../../Crud/GetAllInRotatie/page';
import styles from '../Rotatie.module.css';

interface Crop {
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety: string;
}

interface CropsListProps {
  crops: Crop[];
}

function CropsList({ crops }: CropsListProps) {
  return (
    <div>
      <GridGenerator cols={3}>
        {crops.map((crop) => (
          <div className={styles.gridItem} key={crop._id}>
            <Continut crop={crop} />
          </div>
        ))}
      </GridGenerator>
    </div>
  );
}

export default CropsList;
