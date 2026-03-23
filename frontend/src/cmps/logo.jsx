import { Link } from 'react-router-dom'

// No static image for logo, we'll use a styled icon or text
export default function Logo () {
      return (
            <Link to={'/'} className='logo'>
                  <div className='logo-icon'>
                        <span className='icon-left'></span>
                        <span className='icon-right'></span>
                  </div>
                  <h2 className='logo-title'>workio</h2>
            </Link>
      )
}
