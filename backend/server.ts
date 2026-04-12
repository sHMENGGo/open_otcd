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
// app.post('/api/post/globalSearch', async (req, res) => {
//   try {
//     // 1. Extract the search term from the request body
//     const { searchTerm } = req.body;

//     // 2. Validate input: Ensure the search term exists and is a string
//     if (!searchTerm || typeof searchTerm !== 'string') {
//       return res.status(400).json({ 
//         error: 'Bad Request', 
//         message: 'A valid "searchTerm" string is required in the request body.' 
//       });
//     }

//     // 3. Get all model names straight from your Prisma schema
//     const models = Prisma.dmmf.datamodel.models;

//     // 4. Generate the array of Prisma Promises
//     const searchPromises = models.map((model) => {
//       const delegateName = model.name.charAt(0).toLowerCase() + model.name.slice(1);

//       const stringFields = model.fields
//         .filter(field => field.type === 'String' && !field.isList)
//         .map(field => field.name);

//       if (stringFields.length === 0) return Promise.resolve(null);

//       const orConditions = stringFields.map(field => ({
//         [field]: { contains: searchTerm, mode: 'insensitive' }
//       }));

//       // @ts-ignore
//       return prisma[delegateName].findMany({
//         where: { OR: orConditions },
//         take: 10 
//       }).then(records => {
//         return records.length > 0 ? { table: model.name, data: records } : null;
//       }).catch(err => {
//         console.error(`Failed on table ${model.name}:`, err);
//         return null;
//       });
//     });

//     // 5. Fire all generated Promises concurrently
//     const rawResults = await Promise.all(searchPromises);

//     // 6. Filter out the nulls
//     const finalMatches = rawResults.filter(result => result !== null);

//     // 7. Send the appropriate response to the client
//     if (finalMatches.length === 0) {
//       return res.status(404).json({ 
//         message: "No matches found in the database.", 
//         results: [] 
//       });
//     }

//     return res.status(200).json({ 
//       message: "Search successful", 
//       results: finalMatches 
//     });

//   } catch (error) {
//     // Catch any unexpected top-level errors
//     console.error("Global search endpoint error:", error);
//     return res.status(500).json({ 
//       error: 'Internal Server Error', 
//       message: 'Something went wrong while executing the search.' 
//     })
//   }
// })
