import express from 'express'
import type { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { prisma } from './lib/prisma'
import {getNews, parseThreatFilter, parseLimit, parsePage} from './services/news-service';
import { pool } from './lib/db';
import verifyToken from './utils/check-token'
import cookieParser from 'cookie-parser'
dotenv.config()

const app = express()

// Middleware
app.use(cors({origin:"http://localhost:3000", credentials: true})) // Allows React to talk to this API
app.use(express.json()) // Parses incoming JSON requests
app.use(cookieParser()) // Parses cookies from incoming requests
app.listen(3001, () => {console.log('Server is running on http://localhost:3001')})

// Test the database connection
async function checkConnection() {
	try {
		const client = await pool.connect()
		console.log("✅ Database connection successful")
		client.release()
	} catch (err) {console.error("❌ Database connection failed:", err)
	} finally {await pool.end()}
} checkConnection()

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
		// Person data
		const person_names = await prisma.latvia_person_names.findMany({
  			where: {fullname: {contains: searchInput, mode: 'insensitive'}},
  			omit: { link: true, link_person_statement: true},
  			take: 100,
			include: {person_statement: {
				omit: { link: true },
				include: {
					person_addresses: { omit: { link_person_statement: true, link: true } },
					person_identifiers: { omit: { link_person_statement: true, link: true } },
					person_nationalities: { omit: { link_person_statement: true, link: true } },
					person_source_assertedby: { omit: { link_person_statement: true, link: true } }
				}
			}}
		})
		// OOC data
		const person_statement_statementids = person_names.map(person => person.person_statement?.statementid).filter((id): id is string => !!id)
		const ooc_statements = await prisma.latvia_ooc_statement.findMany({
			where: {interestedparty_describedbypersonstatement: {in: person_statement_statementids}},
			omit: { link: true},
			include: {
				ooc_source_assertedby: {omit: {link_ooc_statement: true, link: true}}, 
				ooc_interests: {omit: {link_ooc_statement: true, link: true}}
			}
		})
		// Entity data
		const ooc_statement_subject_describedbyentitystatements = ooc_statements.map(ooc => ooc.subject_describedbyentitystatement).filter((id): id is string => !!id)
		const entity_statements = await prisma.latvia_entity_statement.findMany({
			where: {statementid: {in: ooc_statement_subject_describedbyentitystatements}},
			omit: { link: true },
			include: {
				entity_addresses: { omit: { link_entity_statement: true, link: true } },
				entity_identifiers: { omit: { link_entity_statement: true, link: true } },
				entity_source_assertedby: { omit: { link_entity_statement: true, link: true } }
			}
		})
		// Combine and flatten data
		const result = person_names.flatMap((person) => {
			const {fullname, person_statement, ...flatten_person} = person || {}
			const {statementid, person_addresses, person_identifiers, person_nationalities, person_source_assertedby, ...flatten_person_statement} = person_statement || {}
			const base_person = {fullname,  ...flatten_person, ...flatten_person_statement, ...person_addresses?.[0] || {}, ...person_identifiers?.[0] || {}, ...person_nationalities?.[0] || {}, ...person_source_assertedby?.[0] || {}}
			const related_ooc = ooc_statements.filter(ooc => ooc.interestedparty_describedbypersonstatement === statementid)
			if(related_ooc.length === 0) return base_person
			return related_ooc.map(ooc => {
				const {ooc_source_assertedby, ooc_interests, ...flatten_ooc} = ooc
				const base_ooc = {...base_person, ...flatten_ooc, ...ooc_source_assertedby?.[0] || {}, ...ooc_interests?.[0] || {}}
				const related_entity = entity_statements.find(entity => entity.statementid === ooc.subject_describedbyentitystatement)
				if(!related_entity) return base_ooc
				const {entity_addresses, entity_identifiers, entity_source_assertedby, ...flatten_entity} = related_entity
				return {
					...base_ooc,
					...flatten_entity,	
					...entity_addresses?.[0] || {},
					...entity_identifiers?.[0] || {},
					...entity_source_assertedby?.[0] || {}
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
		// Person data
		const person_names = await prisma.slovakia_person_names.findMany({
			where: {fullname: {contains: searchInput, mode: 'insensitive'}},
			take: 100,
			omit: {link: true, link_person_statement: true},
			include: {person_statement: {
				omit: {link: true},
				include: {
					person_addresses: {omit: {link_person_statement: true, link: true}},
					person_identifiers: {omit: {link_person_statement: true, link: true}},
					person_nationalities: {omit: {link_person_statement: true, link: true}}
				}
			}}
		})
		// OOC data
		const person_statement_statementids = person_names.map(person => person.person_statement?.statementid).filter((id): id is string => !!id)
		const ooc_statements = await prisma.slovakia_ooc_statement.findMany({
			where: {interestedparty_describedbypersonstatement: {in: person_statement_statementids}},
			omit: { link: true}
		})
		// Entity data
		const ooc_statement_subject_describedbyentitystatements = ooc_statements.map(ooc => ooc.subject_describedbyentitystatement).filter((id): id is string => !!id)
		const entity_statements = await prisma.slovakia_entity_statement.findMany({
			where: {statementid: {in: ooc_statement_subject_describedbyentitystatements}},
			omit: { link: true },
			include: {
				entity_addresses: { omit: { link_entity_statement: true, link: true } },
				entity_identifiers: { omit: { link_entity_statement: true, link: true } }
			}
		})
		// Combine and flatten data
		const result = person_names.flatMap((person) => {
			const {fullname, person_statement, ...flatten_person } = person || {}
			const { statementid, person_addresses, person_identifiers, person_nationalities, ...flatten_person_statement} = person_statement || {}
			const base_person = {fullname, ...flatten_person, ...flatten_person_statement, ...person_addresses?.[0] || {}, ...person_identifiers?.[0] || {}, ...person_nationalities?.[0] || {}}
			const related_ooc = ooc_statements.filter(ooc => ooc.interestedparty_describedbypersonstatement === statementid)
			if(related_ooc.length === 0) return base_person
			return related_ooc.map(ooc => {
				const { ...flatten_ooc } = ooc
				const base_ooc = { ...base_person, ...flatten_ooc }
				const related_entity = entity_statements.find(entity => entity.statementid === ooc.subject_describedbyentitystatement)
				if(!related_entity) return base_ooc
				const { entity_addresses, entity_identifiers, ...flatten_entity } = related_entity
				return {
					...base_ooc,
					...flatten_entity,
					...entity_addresses?.[0] || {},
					...entity_identifiers?.[0] || {}
				}
			})
		})
		res.status(200).json({result, message: "Search successful"})
	} catch (err){
		console.error("Error during search:", err)
		res.status(500).json({ error: 'Search database failed. Internal Server Error' })
	}
})

// Search gleif by name
app.post('/api/post/gleif', verifyToken, async (req, res) => {
	const { searchInput } = req.body
	try {
		// Entity data
		const entity_statements = await prisma.gleif_version_0_4_entity_statement.findMany({
			where: {recorddetails_name: {contains: searchInput, mode: 'insensitive'}},
			take: 100,
			omit: {link: true},
			include: {
				entity_recorddetails_addresses: {omit: {link_entity_statement: true, link: true}}, 
				entity_recorddetails_identifiers: {omit: {link_entity_statement: true, link: true}}, 
				entity_source_assertedby: {omit: {link_entity_statement: true, link: true}}
			}
		})
		// Relationship data
		const entities_record_ids = entity_statements.map(entity => entity.recordid).filter((id): id is string => !!id)
		const relationship_statements = await prisma.gleif_version_0_4_relationship_statement.findMany({
			where: {recorddetails_subject: {in: entities_record_ids}},
			omit: {link: true},
			include: {
				relationship_source_assertedby: {omit: {link_relationship_statement: true}},
				relationship_recorddetails_interests: {omit: {link_relationship_statement: true}},
				relationship_annotations: {omit: {link_relationship_statement: true}}
			}
		})
		// Combine and flatten data
		const result = entity_statements.flatMap((entity) => {
			const {entity_recorddetails_addresses, entity_recorddetails_identifiers, entity_source_assertedby, recorddetails_name, ...flatten_entity} = entity
			const base_entity = {recorddetails_name, ...flatten_entity, ...entity_recorddetails_addresses?.[0] || {} as object, ...entity_recorddetails_identifiers?.[0] || {} as object, ...entity_source_assertedby?.[0] || {}}
			const related_relationships = relationship_statements.filter(rel => rel.recorddetails_subject === entity.recordid)
			if(related_relationships.length === 0) return base_entity
			return related_relationships.flatMap(rel => {
				const {relationship_source_assertedby, relationship_recorddetails_interests, relationship_annotations, ...flatten_rel} = rel
				return {
					...base_entity,
					...flatten_rel,
					...(relationship_source_assertedby?.[0] || {}),
					...(relationship_recorddetails_interests?.[0] || {}),
					...(relationship_annotations?.[0] || {})
				}
			})
		})
		res.status(200).json({result, message: "Search successful"})
	} catch (err){
		console.error("Error during search:", err)
		res.status(500).json({ error: 'Search database failed. Internal Server Error' })
	}
})

// Search register by name
app.post('/api/post/register', verifyToken, async (req, res) => {
	const { searchInput } = req.body
	try {
		// Person data
		const person_names = await prisma.register_person_names.findMany({
			where: {fullname: {contains: searchInput, mode: 'insensitive'}},
			take: 100,
			omit: {link: true},
			include: {person_statement: {
				omit: {link: true},
				include: {
					person_addresses: {omit: {link_person_statement: true, link: true}},
					person_identifiers: {omit: {link_person_statement: true, link: true}},
					person_nationalities: {omit: {link_person_statement: true, link: true}},
				}
			}}
		})
		// OOC data
		const person_statement_statementids = person_names.map(person => person.person_statement?.statementid).filter((id): id is string => !!id)
		const ooc_statements = await prisma.register_ooc_statement.findMany({
			where: {interestedparty_describedbypersonstatement: {in: person_statement_statementids}},
			omit: { link: true},
			include: {ooc_interests: {omit: {link_ooc_statement: true, link: true}}}
		})
		// Entity data
		const ooc_statement_subject_describedbyentitystatements = ooc_statements.map(ooc => ooc.subject_describedbyentitystatement).filter((id): id is string => !!id)
		const entity_statements = await prisma.register_entity_statement.findMany({
			where: {statementid: {in: ooc_statement_subject_describedbyentitystatements}},
			omit: { link: true },
			include: {
				entity_addresses: { omit: { link_entity_statement: true, link: true } },
				entity_identifiers: { omit: { link_entity_statement: true, link: true } }
			}
		})
		// Combine and flatten data
		const result = person_names.flatMap((person) => {
			const {fullname, person_statement, ...flatten_person} = person || {}
			const {statementid, person_addresses, person_identifiers, person_nationalities, ...flatten_person_statement} = person_statement || {}
			const base_person = {fullname, ...flatten_person, ...flatten_person_statement, ...person_addresses?.[0] || {}, ...person_identifiers?.[0] || {}, ...person_nationalities?.[0] || {}}
			const related_ooc = ooc_statements.filter(ooc => ooc.interestedparty_describedbypersonstatement === statementid)
			if(related_ooc.length === 0) return base_person
			return related_ooc.map(ooc => {
				const {ooc_interests, ...flatten_ooc} = ooc
				const base_ooc = {...base_person, ...flatten_ooc, ...ooc_interests?.[0] || {}}
				const related_entity = entity_statements.find(entity => entity.statementid === ooc.subject_describedbyentitystatement)
				if(!related_entity) return base_ooc
				const {entity_addresses, entity_identifiers, ...flatten_entity} = related_entity
				return {
					...base_ooc,
					...flatten_entity,	
					...entity_addresses?.[0] || {},
					...entity_identifiers?.[0] || {}
				}
			})
		})
		res.status(200).json({result, message: "Search successful"})
	} catch (err){
		console.error("Error during search:", err)
		res.status(500).json({ error: 'Search database failed. Internal Server Error' })
	}
})

// Search UK by name
app.post('/api/post/uk', verifyToken, async (req, res) => {
	const { searchInput } = req.body
	try {
		// Person data
		const person_names = await prisma.uk_version_0_4_person_recorddetails_names.findMany({
			where: { fullname: { contains: searchInput, mode: 'insensitive' } },
			take: 100,
			omit: { link: true, link_person_statement: true },
			include: {person_statement: {
				omit: { link: true},
				include: {
					person_annotations: { omit: { link_person_statement: true, link: true } },
					person_recorddetails_addresses: { omit: { link_person_statement: true, link: true } },
					person_recorddetails_taxresidencies: { omit: { link_person_statement: true, link: true } },
					person_source_assertedby: { omit: { link_person_statement: true, link: true } }
				}
			}}
		})
		// Relationship data
		const person_statement_recordid = person_names.map(person => person.person_statement?.recordid).filter((id): id is string => !!id)
		const relationship_statements = await prisma.uk_version_0_4_relationship_statement.findMany({
			where: {recorddetails_interestedparty: { in: person_statement_recordid }},
			include: {
				relationship_source_assertedby: { omit: { link_relationship_statement: true } },
				relationship_recorddetails_interests: { omit: { link_relationship_statement: true } },
				relationship_annotations: { omit: { link_relationship_statement: true } }
			}
		})
		// Entity data
		const relationship_subjects = relationship_statements.map(rel => rel.recorddetails_subject).filter((id): id is string => !!id)
		const entity_statements = await prisma.uk_version_0_4_entity_statement.findMany({
			where: {declarationsubject: { in: relationship_subjects }},
			include: {
				entity_annotations: { omit: { link_entity_statement: true, link: true } },
				entity_recorddetails_addresses: { omit: { link_entity_statement: true, link: true } },
				entity_recorddetails_identifiers: { omit: { link_entity_statement: true, link: true } },
				entity_source_assertedby: { omit: { link_entity_statement: true, link: true } }
			}
		})
		// Combine and flatten data
		const result = person_names.flatMap((person) => {
			const { fullname, person_statement, ...flatten_person } = person || {}
			const { statementid, person_annotations, person_recorddetails_addresses, person_recorddetails_taxresidencies, person_source_assertedby, ...flatten_person_statement } = person_statement || {}
			const base_person = { fullname, ...flatten_person, ...flatten_person_statement, ...(person_annotations?.[0] || {}), ...person_recorddetails_addresses?.[0] || {}, ...person_recorddetails_taxresidencies?.[0] || {}, ...person_source_assertedby?.[0] || {} }
			const related_relationships = relationship_statements.filter(rel => rel.recorddetails_interestedparty === statementid)
			if (related_relationships.length === 0) return base_person
			return related_relationships.map(rel => {
				const { relationship_source_assertedby, relationship_recorddetails_interests, relationship_annotations, ...flatten_rel } = rel
				const base_rel = { ...base_person, ...flatten_rel, ...relationship_source_assertedby?.[0] || {}, ...relationship_recorddetails_interests?.[0] || {}, ...relationship_annotations?.[0] || {} }
				const related_entity = entity_statements.find(entity => entity.declarationsubject === rel.recorddetails_subject)
				if (!related_entity) return base_rel
				const { entity_annotations, entity_recorddetails_addresses, entity_recorddetails_identifiers, entity_source_assertedby, ...flatten_entity } = related_entity
				return {
					...base_rel,
					...flatten_entity,
					...entity_annotations?.[0] || {},
					...entity_recorddetails_addresses?.[0] || {},
					...entity_recorddetails_identifiers?.[0] || {},
					...entity_source_assertedby?.[0] || {}
				}
			})
		})
		res.status(200).json({ result, message: "Search successful" })
	} catch (err) {
		console.error("Error during search:", err)
		res.status(500).json({ error: 'Search database failed. Internal Server Error' })
	}
})

// =============================== NEWS SCRAPER ==================================


app.get('/api/get/news', async (req: Request, res: Response) => {
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




