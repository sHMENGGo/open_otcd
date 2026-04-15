import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Pool } from 'pg'
import { prisma } from './lib/prisma'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { table } from 'node:console'
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

// Search latvia by name
app.post('/api/post/search', verifyToken, async (req, res) => {
	const { searchInput } = req.body
	try {
		const people = await prisma.latvia_person_names.findMany({
			where: {fullname: { contains: searchInput, mode: 'insensitive' }},
			include: {
				person_statement: {
					omit: {link: true, statementid: true},
					include: {
						person_nationalities: {omit: {link: true, id: true}}, 
						person_addresses: {omit: {link: true, id: true, link_person_statement: true}}, 
						person_identifiers: {omit: {link: true, id: true}}, 
						person_source_assertedby: {omit: {link: true, id: true}}
					},
				}
			},
			omit: {link: true, id:true, link_person_statement: true, givenname: true, familyname: true},
			take: 20
		})

		const result = people.map(({ person_statement, ...person }) => {
			if (!person_statement) return person

			const {person_nationalities, person_addresses, person_identifiers, person_source_assertedby, ...flatten_person_statement} = person_statement
			return {
				...person,
				...flatten_person_statement,
				...(person_addresses[0] || {}),
				...(person_nationalities[0] || {}),
				...(person_identifiers[0] || {}),
				...(person_source_assertedby[0] || {})
			}
		})
		res.status(200).json({result})
	} catch (err){
		console.error("Error during search:", err)
		res.status(500).json({ error: 'Search database failed. Internal Server Error' })
	}
})

// Search the whole database
app.post('/api/post/searchAll', verifyToken, async (req, res) => {
	const { searchAll } = req.body
	try {
		const [
			latvia_person_addresses,
			latvia_person_identifiers, 
			latvia_person_nationalities,
			latvia_person_source_assertedby,
			latvia_person_names,
			latvia_person_statement
		] = await Promise.all([
			prisma.latvia_person_addresses.findMany({where: {country: { contains: searchAll, mode: 'insensitive' }}}),
			prisma.latvia_person_identifiers.findMany({where: {identifier_number: { contains: searchAll, mode: 'insensitive' }}}),
			prisma.latvia_person_nationalities.findMany({where: {name: { contains: searchAll, mode: 'insensitive' }}}),
			prisma.latvia_person_source_assertedby.findMany({where: {name: { contains: searchAll, mode: 'insensitive' }}}),
			prisma.latvia_person_names.findMany({where: {fullname: { contains: searchAll, mode: 'insensitive' }}}),
			prisma.latvia_person_statement.findMany({where: { OR: [
				{statementtype: { contains: searchAll, mode: 'insensitive' }},
				{persontype: { contains: searchAll, mode: 'insensitive' }},
				{birthdate: { contains: searchAll, mode: 'insensitive' }},
				{publicationdetails_bodsversion: { contains: searchAll, mode: 'insensitive' }},
				{publicationdetails_license: { contains: searchAll, mode: 'insensitive' }},
				{publicationdetails_publisher_name: { contains: searchAll, mode: 'insensitive' }},
				{publicationdetails_publisher_url: { contains: searchAll, mode: 'insensitive' }},
				{source_type: { contains: searchAll, mode: 'insensitive' }},
				{unspecifiedpersondetails_reason: { contains: searchAll, mode: 'insensitive' }},
			]}})
		])

		const result = []

		if (latvia_person_addresses.length > 0) result.push({ table: 'latvia_person_addresses', data: latvia_person_addresses })
		if (latvia_person_identifiers.length > 0) result.push({ table: 'latvia_person_identifiers', data: latvia_person_identifiers })
		if (latvia_person_nationalities.length > 0) result.push({ table: 'latvia_person_nationalities', data: latvia_person_nationalities })
		if (latvia_person_source_assertedby.length > 0) result.push({ table: 'latvia_person_source_assertedby', data: latvia_person_source_assertedby })
		if (latvia_person_names.length > 0) result.push({ table: 'latvia_person_names', data: latvia_person_names })
		if (latvia_person_statement.length > 0) result.push({ table: 'latvia_person_statement', data: latvia_person_statement })
		
		res.status(200).json({ result })
	} catch (err){
		console.error("Error during search:", err)
		res.status(500).json({ error: 'Search database failed. Internal Server Error' })
	}
})