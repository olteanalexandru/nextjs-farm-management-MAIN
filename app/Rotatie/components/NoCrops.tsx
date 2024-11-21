import styles from '../Rotatie.module.css';
import { useTranslations } from 'next-intl';

function NoCrops() {
  const t = useTranslations('NoCrops');
  return (
    <div className={styles.noCrops}>
      <h3>
        {t('noCrops')}
      </h3>
      <p>
        {t('noCropsMessage')}
      </p>
    </div>
  );
}

export default NoCrops;


