import { Link } from 'react-router-dom'
const logo = require('../assets/img/logo.png')

export default function Logo () {
      return (
            <Link to={'/'} className='logo'>
                  <img src={logo} alt="workio" className='logo-img' />
                  <h1 className='logo-title'>workio</h1>
            </Link>
      )
}
