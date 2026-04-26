import { useState } from 'react'
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
	const [loading, setLoading] = useState(false)
	const [searchResults, setSearchResults] = useState<Record<string, any>[]>([])
	function search(e: any) {
		if(e.key === "Enter" || e.type === "click") {
			setLoading(true)
			console.log("Searching...")
			apiPost(`/${selectedSchema}`, {searchInput}).then(data => {
				console.log("Search status:", data)
				if(data?.result?.length > 0) {
					setSearchResults(data.result)
					console.log("Search results:", data?.result)
				} else {
					setSearchResults([])
					console.log(data.message)
				}
				setLoading(false)
			})
		}
	}

	// Selected schema
	const [selectedSchema, setSelectedSchema] = useState("all")

	return (
		<main className='h-full w-full relative' >
			{/* Header */}
			<section className='w-full h-1/5 flex flex-col bg-linear-to-b from-gray-500 to-black pb-4' >
				{/* logo, search, and menu container */}
				<div className='flex w-full justify-around h-2/3 py-5' >
					<img src="./src/assets/react.svg" alt='' className='' />
					{/* Search Input */}
					<div className='relative w-2/3 flex items-center' >
						<FontAwesomeIcon icon={faMagnifyingGlass} onClick={(e) => search(e)}  className='absolute text-2xl text-gray-500 right-5 hover:text-gray-300 active:scale-90' />
						<input type="text" value={searchInput} onChange={(e)=> setSearchInput(e.target.value)} onKeyDown={(e)=> search(e)} placeholder='Search...'  className='border border-gray-500 outline-0 h-full w-full rounded-full p-2 px-5 text-xl bg-black'  />
					</div>
					{/* Menu Button */}
					<FontAwesomeIcon icon={faBars} onClick={()=> setShowMenu(!showMenu)}  className='text-4xl cursor-pointer hover:scale-105' />
					{showMenu && (
						<section className='w-1/4 absolute top-1/5 right-0 bg-neutral-950 gap-5 p-5 flex flex-col items-center justify-center rounded-b-lg z-30' >
							<button onClick={()=> {setSelectedMenu("newsScraper"); setShowMenu(false)}}  className='w-full bg-blue-950' >News Scraper</button>
							<button onClick={()=> {setSelectedMenu("openOwnership"); setShowMenu(false)}}  className='w-full bg-blue-950' >Open Ownership</button>
							<button onClick={logout}  className='w-full bg-red-950' >Logout</button>
						</section>
					)}
				</div>

				{/* Filter Buttons */}
				{selectedMenu === "openOwnership" && (
					<div className="flex px-5 gap-5 *:border-neutral-600 *:hover:border-white *:active:scale-95 *:select-none *:w-1/2 *:border *:rounded *:p-2" >
						<p onClick={()=> {setSelectedSchema("all"); setSearchResults([])}}  className={`${selectedSchema === "all" ? "bg-blue-950" : ""}`} >All</p>
						<p onClick={()=> {setSelectedSchema("gleif"); setSearchResults([])}}  className={`${selectedSchema === "gleif" ? "bg-blue-950" : ""}`} >Gleif</p>
						<p onClick={()=> {setSelectedSchema("latvia"); setSearchResults([])}}  className={`${selectedSchema === "latvia" ? "bg-blue-950" : ""}`} >Latvia</p>
						<p onClick={()=> {setSelectedSchema("register"); setSearchResults([])}}  className={`${selectedSchema === "register" ? "bg-blue-950" : ""}`} >Register</p>
					<p onClick={()=> {setSelectedSchema("slovakia"); setSearchResults([])}}  className={`${selectedSchema === "slovakia" ? "bg-blue-950" : ""}`} >Slovakia</p>
					<p onClick={()=> {setSelectedSchema("uk"); setSearchResults([])}}  className={`${selectedSchema === "uk" ? "bg-blue-950" : ""}`} >UK</p>
				</div>
				)}
			</section>

		{selectedMenu === "openOwnership" && (<OpenOwnership searchResults={searchResults} loading={loading} />)}
		{selectedMenu === "newsScraper" && (<NewsScraper />)}	
		</main>
	)
}