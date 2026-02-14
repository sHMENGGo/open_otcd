import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'

function App() {


	return (
		<main className='w-svw h-svh relative ' >
			{/* Header */}
			<section className='w-full h-1/5  flex justify-around items-center bg-linear-to-b from-gray-500 to-black' >
				<img src="./src/assets/otcd.png" alt="" className='h-[90%]' />
				<input type="text" className='border border-gray-500 h-1/2 w-2/3 rounded-full p-1 px-5 text-2xl bg-black' placeholder='Search...' />
				<FontAwesomeIcon icon={faBars} className='text-4xl' />	
			</section>
		</main>
	)
}

export default App
