import './App.css'

import Login from './pages/login'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'


function App() {
	
	
	return (
		<main className='w-svw h-svh relative'>
			<Router>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/" element={<Navigate to="/login"/>} />
				</Routes>
			</Router>
		</main>
	)
}

export default App
