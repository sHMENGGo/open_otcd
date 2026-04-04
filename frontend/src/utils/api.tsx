import axios from 'axios'
axios.defaults.baseURL = 'http://localhost:3001' // Set the base URL for all requests

export async function apiGet(url: string) {
   try{  
		const response = await axios.get(`/api/get${url}`, {withCredentials: true})
		return response.data
   } catch (error) {
		console.error("Error API getting data:", error)
		throw error
   }
}

export async function apiPost(url: string, data: any) {
   try {
		const response = await axios.post(`/api/post${url}`, data, {withCredentials: true})
		return response.data
   } catch (error) {
		console.error("Error API posting data:", error)
		throw error
   }
}