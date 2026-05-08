import { use, useEffect, useState } from "react"

export default function OpenOwnership({searchResults, loading}: {searchResults: Record<string, any>[], loading: boolean}) {
   // Get keys of search results for table headers
   const [resultKeys, setResultKeys] = useState<string[]>([])
   let count = 1
   useEffect(() => {
      if(searchResults.length > 0) {
         const keys = Object.keys(searchResults[0])
         setResultKeys(keys)
      }
   }, [searchResults])
   // If no search results, display message
   if(searchResults.length === 0 && loading) {return (<main className='h-4/5 w-full flex items-center justify-center' ><p className="text-3xl" >Searching...</p></main>)}
   if(searchResults.length === 0 && !loading) {return (<main className='h-4/5 w-full flex items-center justify-center' ><p className="text-3xl" >Search keywords to display data</p></main>)}

   return (
      <main className='w-full h-4/5 overflow-auto' >
         <table className='w-full h-full whitespace-nowrap' >
            <thead className="bg-blue-950 px-5 sticky top-0" >
               <tr>
                  {!loading && (<th className="text-center px-5 py-2 border-r border-neutral-700" >No.</th>)}
                  {!loading && resultKeys.map((key) => (
                     <th key={key} className="text-center px-5 py-2 border-r border-neutral-700" >{key.charAt(0).toUpperCase() + key.slice(1)}</th>
                  ))}
               </tr>
            </thead>
            <tbody>
               {!loading && searchResults.map((result) => (
                  <tr key={result.link} className="border-b border-neutral-700 hover:bg-neutral-600" >
                     <td className="text-center px-5 py-2 border-r border-neutral-700" >{count++}</td>
                     {!loading && resultKeys.map((key) => (
                     <td key={key} className="text-center px-5 py-2 border-r border-neutral-700" >
                        {result[key as keyof typeof result] || "N/A"}
                     </td>
                     ))}
                  </tr>
               ))}
            </tbody>
         </table>
      </main>
   )
}