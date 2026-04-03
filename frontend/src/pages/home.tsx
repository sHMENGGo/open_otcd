import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { apiGet } from '../utils/api'
import { useNavigate } from 'react-router-dom'
import NewsScraper from './newsScraper'
import OpenOwnership from './openOwnership'

export default function Home() {
	const [showMenu, setShowMenu] = useState(false)
	const [selectedMenu, setSelectedMenu] = useState("openOwnership")
	const navigate = useNavigate()

    function logout() {
		apiGet('/logout').then(data => {
			if (data.status === "success") {
				navigate('/login', {replace: true})
				console.log("Logout successful!")
			}
		})
	}

	return (
		<main className='h-full w-full relative' >
			{/* Header */}
			<section className='w-full h-1/5  flex justify-around items-center bg-linear-to-b from-gray-500 to-black' >
				<img src="./src/assets/react.svg" alt="" className='h-[60%]' />
				<input type="text" className='border border-gray-500 h-1/2 w-2/3 rounded-full p-1 px-5 text-2xl bg-black' placeholder='Search...' />
				<FontAwesomeIcon icon={faBars} onClick={()=> setShowMenu(!showMenu)}  className='text-4xl cursor-pointer hover:scale-105' />
					{showMenu && (
						<section className='w-1/4 absolute top-1/5 right-0 bg-neutral-950 gap-5 p-5 flex flex-col items-center justify-center rounded-b-lg' >
							<button onClick={()=> {setSelectedMenu("newsScraper"); setShowMenu(false)}}  className='w-full bg-blue-950' >News Scraper coming soon...</button>
							<button onClick={()=> {setSelectedMenu("openOwnership"); setShowMenu(false)}}  className='w-full bg-blue-950' >Open Ownership</button>
							<button onClick={logout}  className='w-full bg-red-950' >Logout</button>
						</section>
					)}
			</section>

		{selectedMenu === "openOwnership" && (<OpenOwnership />)}
		{selectedMenu === "newsScraper" && (<NewsScraper />)}	
		</main>
	)
}