import jwt from 'jsonwebtoken'

export default function verifyToken(req: any, res: any, next: any) {
	const token = req.cookies.accessToken
	if (!token) return res.status(200).json({ error: 'No token provided' })
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!)
		req.user = decoded
		next()
	}catch (err) {
		console.error("Token verification failed:", err)
		return res.status(200).json({ error: 'Token verification failed' })
	}
}