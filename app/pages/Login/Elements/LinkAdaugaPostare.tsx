import {FaUser} from 'react-icons/fa'
import Link from 'next/link'

function LinkAdaugaPostare(){
  return (
  <>
              <Link href='/pages/Login/Posts'>
                <FaUser /> Add/see posts
              </Link>
              
                </>

  ) }

export default LinkAdaugaPostare