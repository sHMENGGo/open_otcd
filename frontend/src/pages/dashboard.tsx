import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'

export default function Dashboard() {
    const [showMenu, setShowMenu] = useState(false)
	const [selectedMenu, setSelectedMenu] = useState("ownership")

    return (
        <>
			{/* Header */}
			<section className='w-full h-1/5  flex justify-around items-center bg-linear-to-b from-gray-500 to-black' >
				<img src="./src/assets/react.svg" alt="" className='h-[60%]' />
				<input type="text" className='border border-gray-500 h-1/2 w-2/3 rounded-full p-1 px-5 text-2xl bg-black' placeholder='Search...' />
				<FontAwesomeIcon icon={faBars} onClick={()=> setShowMenu(!showMenu)}  className='text-4xl cursor-pointer hover:scale-105' />
			</section>

			{showMenu && (
				<section className='w-1/4 absolute top-1/5 right-0 bg-neutral-950 gap-5 p-5 flex flex-col items-center justify-center' >
					<a href="#" onClick={()=> setSelectedMenu("news")}  className='text-xl text-gray-300'>News Scraper coming soon...</a>
					<a href="#" onClick={()=> setSelectedMenu("ownership")}  className='text-xl text-gray-300'>Open Ownership</a>
				</section>
			)}

			{selectedMenu === "ownership" && (
				<section className='w-full h-4/5 flex items-center justify-center' >
					<h1 className='text-4xl text-gray-300'>Open Ownership Data coming soon...</h1>
				</section>
			)}

			{selectedMenu === "news" && (
				<section className='w-full h-4/5 flex items-center justify-center' >
					<h1 className='text-4xl text-gray-300'>News Scraper coming soon...</h1>
				</section>
			)}
		</>
    )
}