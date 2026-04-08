import './App.css'

import Login from './pages/login'
import Home from './pages/home'
import NewsScraper from './pages/news-scraper'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'


function App() {
	
	
	return (
		<main className='min-h-svh w-full relative bg-neutral-950'>
			<Router>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/" element={<Navigate to="/login"/>} />
					<Route path="/home" element={<Home/>} />
					<Route path="/news" element={<NewsScraper />} />
				</Routes>
			</Router>
		</main>
	)
}

export default App
