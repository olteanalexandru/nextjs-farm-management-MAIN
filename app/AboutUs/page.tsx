// import Mail from "../../Componente/Mail";
import Link from "next/link";
import { useTranslations } from 'next-intl';



export default function AboutUs() {
  const t = useTranslations('AboutUs');
  return (
    <div>
      <div id="background" className="jumbotron text-center" style={{ borderBottom: '1px darkgray dotted' }}>
        <h1>{t('title')}</h1>
        <h2>{t('subtitle')}</h2>
      </div>
      <div className="container text-center border-colorat" style={{ marginBottom: '8rem' }}>
        <h2>{t('vision')}</h2>
        <br />
        <div className="row">
          <div className="col-sm-4">
            <h4>{t('cropManagement')}</h4>
            <p>{t('cropManagementDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('supportCollaboration')}</h4>
            <p>{t('supportCollaborationDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('comprehensiveTracking')}</h4>
            <p>{t('comprehensiveTrackingDescription')}</p>
          </div>
        </div>
        <br /><br />
        <div className="row">
          <div className="col-sm-4">
            <h4>{t('robustAnalytics')}</h4>
            <p>{t('robustAnalyticsDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('efficiencyProfitability')}</h4>
            <p>{t('efficiencyProfitabilityDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('contactUs')}</h4>
            <li className="nav-item nav-list">
              <Link href="/contact" className="nav-link">
                {t('contactUsForm')}
              </Link>
            </li>
          </div>
        </div>
      </div>
    </div>
  );
}




