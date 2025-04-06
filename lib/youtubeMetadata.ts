import axios from "axios";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  const minutes = parseInt(match?.[1] || "0", 10);
  const seconds = parseInt(match?.[2] || "0", 10);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}


export async function getYoutubeMetadata(extractedId: string) {
    
    try {
        
        const response = await axios.get(
          "https://www.googleapis.com/youtube/v3/videos",
          {
            params: {
              part: "snippet,contentDetails",
              id: extractedId,
              key: YOUTUBE_API_KEY,
            },
          }
        );

        const data = response.data as {
          items: Array<{
            snippet: {
              title: string;
              channelTitle: string;
              thumbnails: {
                high: { url: string };
              };
            };
            contentDetails: {
              duration: string;
            };
          }>;
        };

        const item = data.items?.[0];

        if (!item) {
            console.error("No items found in YouTube response");
            return null
          }

        const metadata = {
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.high.url,
          duration: parseDuration(item.contentDetails.duration),
        };

        return metadata;

    } catch (error) {
        console.error("Error fetching YouTube metadata:", error);
        return null;
        
    }
}


 