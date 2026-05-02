import express from 'express'
import type { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { prisma } from './lib/prisma'
import {getNews, parseThreatFilter, parseLimit, parsePage} from './services/news-service';
import { buildOwnershipGraph } from './services/ownership-graph-service';
import { pool } from './lib/db';
import verifyToken from './utils/check-token'
import cookieParser from 'cookie-parser'
dotenv.config()

const app = express()

// Middleware
app.use(cors({origin:"http://localhost:3000", credentials: true})) 
app.use(express.json()) 
app.use(cookieParser()) 
app.listen(3001, () => {console.log('Server is running on http://localhost:3001')})

// Test the database connection 
async function checkConnection() {
	try {
		const client = await pool.connect()
		console.log("✅ Database connection successful")
		client.release()
	} catch (err) {
		console.error("❌ Database connection failed:", err)
	}
}
checkConnection()

// ==========================================================================================




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
app.post('/api/post/latvia', verifyToken, async (req, res) => {
	const { searchInput } = req.body
	try {
		const people = await prisma.latvia_person_names.findMany({
			where: {fullname: { contains: searchInput, mode: 'insensitive' }},
			omit: {link: true, link_person_statement: true, givenname: true, familyname: true},
			take: 20,
			include: {
				person_statement: {
					omit: {link: true},
					include: {
						person_nationalities: {omit: {link: true, id: true, link_person_statement: true}}, 
						person_addresses: {omit: {link: true, id: true, link_person_statement: true}}, 
						person_identifiers: {omit: {link: true, id: true, link_person_statement: true}}, 
						person_source_assertedby: {omit: {link: true, id: true, link_person_statement: true}},
						ooc_statement: {
							omit: {link: true},
							include: {
								ooc_interests: {omit: {link: true, id: true, link_ooc_statement: true}},
								ooc_source_assertedby: {omit: {link: true, id: true, link_ooc_statement: true}},
								entity_statement: {
									omit: {link: true},
									include: {
										entity_addresses: {omit: {link: true, id: true, link_entity_statement: true, statementid: true}}, 
										entity_identifiers: {omit: {link: true, id: true, statementid: true, link_entity_statement: true}}, 
										entity_source_assertedby: {omit: {link: true, id: true, link_entity_statement: true, statementid: true}}
									}
								}
							}
						}
					}
				}
			}
		})
		if(!people || people.length === 0) return res.status(401).json({result: [], message: "No results found"})

		const result = people.flatMap(({ person_statement, ...person }) => {
			if (!person_statement) return person
			const {person_nationalities, person_addresses, person_identifiers, person_source_assertedby, ooc_statement, ...flatten_person_statement} = person_statement
			const basePerson = {...person, ...flatten_person_statement, ...(person_addresses[0] || {}), ...(person_nationalities[0] || {}), ...(person_identifiers[0] || {}), ...(person_source_assertedby[0] || {})}
			if(!ooc_statement) return basePerson
			return ooc_statement.map((ooc)=> {
				const {ooc_interests, ooc_source_assertedby, entity_statement, ...flatten_ooc} = ooc
				const {entity_addresses, entity_identifiers, entity_source_assertedby, ...flatten_entity} = entity_statement || {}
				return {
					...basePerson,
					...flatten_ooc || {},
					...(ooc_interests?.[0] || {}),
					...(ooc_source_assertedby?.[0] || {}),
					...flatten_entity || {},
					...(entity_addresses?.[0] || {}),
					...(entity_identifiers?.[0] || {}),
					...(entity_source_assertedby?.[0] || {})
				}
			})
		})
		res.status(200).json({result, message: "Search successful"})
	} catch (err){
		console.error("Error during search:", err)
		res.status(500).json({ error: 'Search database failed. Internal Server Error' })
	}
})

// Search slovakia by name
app.post('/api/post/slovakia', verifyToken, async (req, res) => {
	const { searchInput } = req.body
	try {
		const people = await prisma.slovakia_person_names.findMany({
  			where: {fullname: {contains: searchInput, mode: 'insensitive'}},
  			take: 10,
  			omit: { link: true, id: true, link_person_statement: true },
			include: {
				person_statement: {
					omit: { link: true },
					include: {
						person_nationalities: { omit: { link_person_statement: true } },
						person_addresses: { omit: { link_person_statement: true, } },
						person_identifiers: { omit: { link_person_statement: true } },
						ooc_statement: {
							omit: { interestedparty_describedbypersonstatement: true, subject_describedbyentitystatement: true },
							include: {
								entity_statement: {
									omit: { link: true },
									include: {
										entity_addresses: { omit: { link_entity_statement: true } },
										entity_identifiers: { omit: { link_entity_statement: true } },
									}
								}
							}
						}
					}
				}
			}
		});
		if(people.length === 0) return res.status(200).json({result: [], message: "No results found"})

		const result = people.flatMap(({ person_statement, ...person }) => {
			if (!person_statement) return person
			const {person_nationalities, person_addresses, person_identifiers, ooc_statement, ...flatten_person_statement} = person_statement
			const basePerson = {...person, ...flatten_person_statement, ...(person_addresses[0] || {}), ...(person_nationalities[0] || {}), ...(person_identifiers[0] || {})}
			if(!ooc_statement) return basePerson
			return ooc_statement.map((ooc)=> {
				const {entity_statement, ...flatten_ooc} = ooc
				const {entity_addresses, entity_identifiers, ...flatten_entity} = entity_statement || {}
				return {
					...basePerson,
					...flatten_ooc || {},
					...flatten_entity || {},
					...(entity_addresses?.[0] || {}),
					...(entity_identifiers?.[0] || {})
				}
			})
		})
		res.status(200).json({result, message: "Search successful"})
	} catch (err){
		console.error("Error during search:", err)
		res.status(500).json({ error: 'Search database failed. Internal Server Error' })
	}
})

app.post('/api/post/ownership-graph', verifyToken, async (req, res) => {
	const { registry, entityStatementId } = req.body as {
		registry?: string
		entityStatementId?: string
	}
	if (!entityStatementId || typeof entityStatementId !== 'string') {
		return res.status(400).json({ error: 'entityStatementId is required' })
	}
	try {
		const graph = await buildOwnershipGraph(String(registry ?? 'latvia'), entityStatementId.trim())
		res.status(200).json(graph)
	} catch (err) {
		console.error('ownership-graph:', err)
		res.status(500).json({ error: 'Failed to build ownership graph' })
	}
})

const searchInput = 'jin';


// =============================== NEWS SCRAPER ==================================


app.get('/api/news', async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const threatFilter = parseThreatFilter(req.query.threat);
  const pageSize = parseLimit(req.query.pageSize ?? req.query.limit);
  const page = parsePage(req.query.page)

// Test the database connection
try {
    const result = await getNews({ search, threatFilter, page, pageSize });
    res.json(result);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ message: 'Failed to fetch scraped news.' });
  }
})

// ==========================================================================================




