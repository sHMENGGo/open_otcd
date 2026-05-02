import './App.css'
import Login from './pages/login'
import Home from './pages/home'
import OwnershipGraph from './pages/ownershipGraph'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { apiGet } from './utils/api'
import { useEffect } from 'react'

function App() {
	const navigate = useNavigate()

	useEffect(() => {
		apiGet('/verifyToken').then(data => {
			const path = window.location.pathname
			if (data.user) {
				console.log("User is logged in:", data.user.username)
				if (path === '/login' || path === '/') {
					navigate('/home', { replace: true })
				}
			} else {
				console.log("No user logged in")
				if (path !== '/login') {
					navigate('/login', { replace: true })
				}
			}
		})
	}, [])
	
	
	return (
		<main className='w-screen  h-screen' >
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/" element={<Navigate to="/login"/>} />
				<Route path="/home" element={<Home />} />
				<Route path="/newscraper" element={<Home />} />
				<Route path="/ownership/graph" element={<OwnershipGraph />} />
			</Routes>
		</main>
	)
}

export default App
