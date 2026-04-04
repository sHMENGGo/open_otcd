import './App.css'
import Login from './pages/login'
import Home from './pages/home'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { apiGet } from './utils/api'
import { useEffect } from 'react'

function App() {
	const navigate = useNavigate()

	useEffect(() => {
		apiGet('/verifyToken').then(data => {
			if (data.user) {
				console.log("User is logged in:", data.user.username)
				navigate('/home', {replace: true})
			}
			else {
				console.log("No user logged in")
				navigate('/login', {replace: true})
			}
		})
	}, [])
	
	
	return (
		<main className='w-screen overflow-hidden h-screen' >
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/" element={<Navigate to="/login"/>} />
				<Route path="/home" element={<Home />} />
			</Routes>
		</main>
	)
}

export default App
