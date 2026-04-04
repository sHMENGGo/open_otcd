import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Pool } from 'pg'
import { prisma } from './lib/prisma'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { stat } from 'node:fs'

// Load environment variables (for your remote DB URL)
dotenv.config()

const app = express()
app.use(cors({origin:"http://localhost:3000", credentials: true})) // Allows React to talk to this API
app.use(express.json()) // Parses incoming JSON requests
app.use(cookieParser()) // Parses cookies for JWT handling

app.get('/', (req, res) => {
	res.send('Hello! The backend is officially running.')
})

// Start Server
app.listen(3001, () => {console.log(`🚀 Server ready at http://localhost:3001`)})

// ==========================================================================================

// Create a PostgreSQL connection pool
const pool = new Pool({connectionString: process.env.DATABASE_URL})

// Test the database connection
async function checkConnection() {
	try {
		const client = await pool.connect()
		console.log("✅ Database connection successful")
		// Optional: Run a simple query to be sure
		const res = await client.query('SELECT NOW()')
		console.log("Server time:", res.rows[0].now)
		client.release()
	} catch (err) {console.error("❌ Database connection failed:", err)
	} finally {await pool.end()}
} checkConnection()

// ==========================================================================================

function verifyToken(req: any, res: any, next: any) {
	const token = req.cookies.accessToken
	if (!token) return res.status(200).json({ error: 'No token provided' })
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!)
		req.user = decoded
		next()
	}catch (err) {
		console.error("Token verification failed:", err)
		return res.status(401).json({ error: 'Token verification failed' })
	}
}

// Login 
app.post('/api/post/login', async (req, res) => {
	const { username, password } = req.body
	try {
		const user = await prisma.user.findUnique({where: {username}})
		if(!user || user.password !== password) return res.status(401).json({ error: 'Incorrect username or password' })
		const accessToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET_KEY!, { expiresIn: '1h' })

		res.cookie('accessToken', accessToken, { 
			httpOnly: true, 
			secure: false, 
			sameSite: 'strict',
			maxAge: 30 * 60 * 1000
		})
		
		res.status(200).json({successLogin: true})
	} catch (err) {
		console.error("Error fetching user from database:", err)
		res.status(500).json({ error: 'Internal Server Error' })
	}
})

// Logout
app.get('/api/get/logout', (req, res) => {
	try {
		res.clearCookie('accessToken', {
			httpOnly: true,
			secure: false,
			sameSite: 'strict'
		})
		res.status(200).json({message: 'Logged out successfully', status: 'success'})
	} catch (err) {
		console.error("Error during logout:", err)
		res.status(500).json({ error: 'Logout failed. Internal Server Error' })
	}
})

// Verify if current user is logged in
app.get('/api/get/verifyToken', verifyToken, async (req, res)=> {
	try {
		const currentToken = (req as any).user
		const currentUser = await prisma.user.findUnique({where: {id: currentToken.id}})
		res.status(200).json({message: "User is logged in", user: currentUser || null})
	} catch (err) {
		console.error("Error verifying token:", err)
		res.status(500).json({ error: 'Verify token. Internal Server Error' })	
	}
})

// Get data of latvia person by name
app.get('/api/get/latvia-person', verifyToken, async (req, res) => {
	try {
		const persons = await prisma.latvia_person_names.findMany({take:40, include: {person_statement: true}})
		res.status(200).json({persons})
		console.log("Fetched persons:", persons? persons : "No persons found")
	} catch (err) {
		console.error("Error fetching data from database:", err)
		res.status(500).json({ error: 'Failed to fetch data  from database. Internal Server Error' })
	}
})
