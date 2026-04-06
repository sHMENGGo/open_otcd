import { apiGet } from "../utils/api"
import { useEffect, useState } from "react"

export default function OpenOwnership({searchResults}: {searchResults: Record<string, any>[]}) {

	return (
		<main className='w-full h-4/5 overflow-auto' >
			<table className='w-full h-full whitespace-nowrap' >
				<thead className="bg-blue-950 px-5 sticky top-0" >
					<tr>
						<th className="text-center px-5 py-2 border-r border-neutral-700" >ID</th>
						<th className="text-center px-5 py-2 border-r border-neutral-700" >Full Name</th>
						<th className="text-center px-5 py-2 border-r border-neutral-700" >Given Name</th>
						<th className="text-center px-5 py-2 border-r border-neutral-700" >Family Name</th>
						<th className="text-center px-5 py-2 border-r border-neutral-700" >Type</th>
						<th className="text-center px-5 py-2 border-r border-neutral-700" >Statement ID</th>
					</tr>
				</thead>
				<tbody>
					{searchResults.map((result) => (
						<tr key={result.id} className="border-b border-neutral-700 hover:bg-neutral-600" >
							<td className="text-center px-5 py-2 border-r border-neutral-700" >{result.id}</td>
							<td className="text-center px-5 py-2 border-r border-neutral-700" >{result.fullname}</td>
							<td className="text-center px-5 py-2 border-r border-neutral-700" >{result.givenname}</td>
							<td className="text-center px-5 py-2 border-r border-neutral-700" >{result.familyname}</td>
							<td className="text-center px-5 py-2 border-r border-neutral-700" >{result.type}</td>
							<td className="text-center px-5 py-2 border-r border-neutral-700" >{result.statementid || "N/A"}</td>
						</tr>
					))}
					{searchResults.length === 0 && (
						<tr>
							<td colSpan={6} className="text-center text-3xl" >No data available</td>
						</tr>
					)}
				</tbody>
			</table>
		</main>
	)
}