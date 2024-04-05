import {FaUser} from 'react-icons/fa'
import Link from 'next/link'

function LinkAdaugaPostare(){
  return (
  <>
              <Link href='/pages/Login/Postari'>
                <FaUser /> Adauga/vezi postari
              </Link>
              
                </>

  ) }

export default LinkAdaugaPostare