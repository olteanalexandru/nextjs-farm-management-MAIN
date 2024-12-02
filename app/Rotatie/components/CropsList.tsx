import GridGenerator from '/app/components/GridGen';
import { CropContent } from '../../components/CropContent';
import styles from '../Rotatie.module.css';
import { Crop } from '../../types/api';

interface CropsListProps {
  crops: Crop[];
}

function CropsList({ crops }: CropsListProps) {
  return (
    <div>
      <GridGenerator cols={3}>
        {crops.map((crop) => (
          <div className={styles.gridItem} key={crop._id}>
            <CropContent crop={crop} />
          </div>
        ))}
      </GridGenerator>
    </div>
  );
}

export default CropsList;
