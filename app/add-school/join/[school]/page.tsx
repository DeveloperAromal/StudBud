import axios from "axios";
import JoinLinkClient from "../../widgets/JoinLinkClient"; // import the client component
import { Metadata } from "next"; // You might need this for metadata later

// For dynamic routes in App Router, the params are automatically inferred
// but it's good to define them for clarity and type safety.
// You can also use Next.js's built-in PageProps if needed.
interface JoinLinkProps {
  params: {
    school: string;
  };
  // If you were using search params, they would be here too:
  // searchParams: { [key: string]: string | string[] | undefined };
}

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Ensure these environment variables are correctly set in .env.local
// and accessible in the Vercel deployment settings.

export default async function JoinLink({ params }: JoinLinkProps) {
  const { school } = params;

  // Data Fetching:
  // In server components, fetch directly. axios is fine, but native fetch is also good.
  let adminData: any;
  try {
    const response = await axios.get(
      `${baseUrl}/api/v1/getSubdomainList/${school}`
    );
    adminData = response.data[0]; // Assuming response.data is an array and you want the first element
  } catch (error) {
    console.error("Error fetching subdomain list:", error);
    // Handle error, e.g., return a fallback UI or throw an error
    return <div>Error loading school data.</div>;
  }

  // Environment Variables:
  // process.env.PORT is typically available during local development
  // but NOT in a Vercel production environment unless explicitly configured
  // as an environment variable or if your server itself is listening on a specific port.
  // For frontend URLs, you usually don't include the port unless it's non-standard (e.g., development).
  // On Vercel, the app runs on standard HTTP/HTTPS ports (80/443).
  // If you intend for this URL to be for local dev, it's fine.
  // If it's for production, reconsider the `:${process.env.PORT}` part.
  const url = `http://${school}.${rootDomain}:${process.env.PORT}`; // Likely problematic for production

  return <JoinLinkClient url={url} adminData={adminData} />; // Pass adminData if needed by client component
}
