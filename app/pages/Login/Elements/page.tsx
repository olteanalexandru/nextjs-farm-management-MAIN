import {FaUser} from 'react-icons/fa'
import Link from 'next/link'
import { useTranslations } from 'next-intl';


function LinkParola(){
  const t = useTranslations('LinkParola');

  return (
  
              <Link href='/pages/Login/Modifica'>
                <FaUser /> {t('ModificaParola')}
              </Link>
  ) }


export default LinkParola

