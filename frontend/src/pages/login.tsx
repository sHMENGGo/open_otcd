import { useState } from "react"
import { apiPost } from "../utils/api"
import { useNavigate } from "react-router-dom"

export default function Login() {
	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")
	const navigate = useNavigate()
	const [loggingIn, setLoggingIn] = useState("LOGIN")


	function login(username: string, password: string) {
		setLoggingIn("LOGGING IN...")
		apiPost('/login', {username, password}).then(data => {
			if (data.successLogin) {navigate('/home', {replace: true}); console.log("Login successful!"); setLoggingIn("LOGIN")}
		})
	}

	return (
		<main className="bg-neutral-800 flex justify-center items-center w-full h-full">
			<section className="w-1/3 h-1/2 bg-neutral-700 rounded-2xl flex flex-col justify-center items-center gap-4 p-20" >
				<h1 className="text-4xl font-bold" >LOGIN</h1>
				<input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username..." className="border rounded-lg p-2 w-full" />
				<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password..." className="border rounded-lg p-2 w-full" />
				<input type="submit" value={loggingIn} onClick={()=> login(username, password)}  className="bg-blue-500 w-full text-white p-2 rounded-lg hover:bg-blue-400 font-bold active:scale-90" />
			</section>

		</main>
	)
}