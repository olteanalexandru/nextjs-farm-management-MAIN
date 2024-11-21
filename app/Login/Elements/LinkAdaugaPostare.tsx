import {FaUser} from 'react-icons/fa'
import Link from 'next/link'
import { useTranslations } from 'next-intl';

function LinkAdaugaPostare(){
  const t = useTranslations('LinkAdaugaPostare');
  return (
  <>
              <Link href='/Login/Posts'>
                <FaUser /> {t('AdaugaPostare')}
              </Link>
              
                </>

  ) }

export default LinkAdaugaPostare

