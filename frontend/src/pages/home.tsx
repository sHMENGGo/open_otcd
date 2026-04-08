import { useDebugValue, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { apiGet, apiPost } from '../utils/api'
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

	// Get data of latvia person by name
	const [searchInput, setSearchInput] = useState("")
	const [searchResults, setSearchResults] = useState<Record<string, any>[]>([])
	function search(e: any) {
		if(e.key === "Enter" || e.type === "click") {
			console.log("Search for:", searchInput)
			apiPost('/search', {searchInput}).then(data => {
				console.log("Search data:", data)
				if(data.result) setSearchResults(data.result)
			})
		}
	}

	return (
		<main className='h-full w-full relative' >
			{/* Header */}
			<section className='w-full h-[15%] flex justify-around items-center bg-linear-to-b from-gray-500 to-black' >
				<img src="./src/assets/react.svg" alt='' className='h-[60%]' />
				{/* Search Input */}
				<div className='relative w-2/3 h-2/5 flex items-center' >
					<FontAwesomeIcon icon={faMagnifyingGlass} onClick={(e) => search(e)}  className='absolute text-2xl text-gray-500 right-5 hover:text-gray-300 active:scale-90' />
					<input type="text" value={searchInput} onChange={(e)=> setSearchInput(e.target.value)} onKeyDown={(e)=> search(e)} placeholder='Search...'  className='border border-gray-500 outline-0 h-full w-full rounded-full p-2 px-5 text-xl bg-black'  />
				</div>
				<FontAwesomeIcon icon={faBars} onClick={()=> setShowMenu(!showMenu)}  className='text-4xl cursor-pointer hover:scale-105' />
					{showMenu && (
						<section className='w-1/4 absolute top-1/5 right-0 bg-neutral-950 gap-5 p-5 flex flex-col items-center justify-center rounded-b-lg z-20' >
							<button onClick={()=> {setSelectedMenu("newsScraper"); setShowMenu(false)}}  className='w-full bg-blue-950' >News Scraper coming soon...</button>
							<button onClick={()=> {setSelectedMenu("openOwnership"); setShowMenu(false)}}  className='w-full bg-blue-950' >Open Ownership</button>
							<button onClick={logout}  className='w-full bg-red-950' >Logout</button>
						</section>
					)}
			</section>

		{selectedMenu === "openOwnership" && (<OpenOwnership searchResults={searchResults} />)}
		{selectedMenu === "newsScraper" && (<NewsScraper />)}	
		</main>
	)
}