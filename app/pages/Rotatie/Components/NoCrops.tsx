import styles from '../Rotatie.module.css';

function NoCrops() {
  return (
    <div className={styles.noCrops}>
      <h3>There are no crops yet</h3>
      <p>Why not add some?</p>
    </div>
  );
}

export default NoCrops;
