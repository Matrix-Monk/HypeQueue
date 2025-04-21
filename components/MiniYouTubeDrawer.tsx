// "use client";

// import { useState } from "react";
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Search } from "lucide-react";
// import axios from "axios";

// interface VideoItem {
//   id: string;
//   title: string;
//   thumbnail: string;
//   url: string;
// }

// export default function YoutubeMiniDrawer({
//   onAddSong,
// }: {
//   onAddSong: (video: VideoItem) => void;
// }) {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState<VideoItem[]>([]);
//   const [loading, setLoading] = useState(false);

//   const handleSearch = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(
//         `/api/youtube/search?q=${encodeURIComponent(query)}`
//       );
//       setResults(res.data.items);
//     } catch (err) {
//       console.error("Search error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Sheet>
//       <SheetTrigger asChild>
//         <Button variant="outline" className="gap-2">
//           <Search size={16} />
//           Search YouTube
//         </Button>
//       </SheetTrigger>

//       <SheetContent
//         side="left"
//         className="w-[85vw] sm:w-[400px] overflow-y-auto"
//       >
//         <h2 className="text-lg font-semibold mb-4">Search YouTube</h2>

//         <div className="flex gap-2 mb-4">
//           <Input
//             placeholder="Search for a song or video..."
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//           />
//           <Button onClick={handleSearch} disabled={loading}>
//             {loading ? "..." : "Go"}
//           </Button>
//         </div>

//         <div className="space-y-4">
//           {results.map((video) => (
//             <div
//               key={video.id}
//               className="flex gap-4 p-2 border border-white/10 rounded-md hover:bg-white/5 transition"
//             >
//               <img
//                 src={video.thumbnail}
//                 alt={video.title}
//                 className="w-20 h-12 object-cover rounded"
//               />
//               <div className="flex-1">
//                 <p className="text-sm font-medium line-clamp-2">
//                   {video.title}
//                 </p>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="text-xs mt-1"
//                   onClick={() => onAddSong(video)}
//                 >
//                   Add to queue
//                 </Button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </SheetContent>
//     </Sheet>
//   );
// }
