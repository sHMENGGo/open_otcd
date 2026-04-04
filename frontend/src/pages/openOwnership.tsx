import { apiGet } from "../utils/api"
import { useEffect, useState } from "react"

export default function OpenOwnership() {

	// Helper function to flatten nested objects into a single level with concatenated keys
	function flattenObject(obj: any, prefix = ''): Record<string, any> {
		let flattened: Record<string, any> = {};

		for (const key in obj) {
			const value = obj[key];
			
			// Create the new key name (e.g., "person_statement_statementdate")
			const newKey = prefix ? `${prefix}_${key}` : key;

			// Detect if it is an object (and make sure it is NOT null, and NOT an array)
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				// It IS an object! Recursively flatten it and merge it into our result.
				const nestedFlattened = flattenObject(value, newKey);
				flattened = { ...flattened, ...nestedFlattened };
			} else {
				// It's a normal value (string, number, null). Just assign it.
				flattened[newKey] = value;
			}
		}
		return flattened;
	}

	// Get data of latvia person by name
	const [persons, setPersons] = useState<Record<string, any>[]>([])
	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await apiGet('/latvia-person')
				console.log("Response from API:", response)
				if(response.persons) {
					const flatData = response.persons.map((person: any) => flattenObject(person))
					setPersons(flatData)
				}
			} catch (err) {console.error("Error fetching data:", err)}
		}
		fetchData()
	}, [])

	// Get property names for table header
	const propertyNames = persons.length > 0 ? Object.keys(persons[0]) : []

	
	

	return (
		<main className='w-full h-4/5 overflow-auto' >
			<table className='w-full h-full' >
				<thead className="bg-blue-950 px-5 sticky top-0" >
					<tr>
						{propertyNames.map((name) => (
							<th key={name} className="text-left px-5 py-2 border-r border-neutral-700" >{name}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{persons.map((person, id) => (
						<tr key={id} className="border-b border-neutral-700 hover:bg-neutral-600" >
							{propertyNames.map((name) => (
								<td key={name} className="text-left p-1 text-sm border-r border-neutral-700 w-fit" >{person[name]}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</main>
	)
}