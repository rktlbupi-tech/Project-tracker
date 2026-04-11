import { Link } from 'react-router-dom'
import { ReactComponent as LogoIcon } from '../assets/img/logo.svg'

export default function Logo () {
      return (
            <Link to={'/'} className='logo'>
                  <LogoIcon className='logo-img' />
                  <h1 className='logo-title'>workio</h1>
            </Link>
      )
}
