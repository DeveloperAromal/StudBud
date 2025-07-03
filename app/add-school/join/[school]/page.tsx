import axios from "axios";
import JoinLinkClient from "../../widgets/JoinLinkClient";

interface PageProps {
  params: {
    school: string;
  };
  // searchParams?: { [key: string]: string | string[] | undefined };
}

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export default async function JoinLink({ params }: PageProps) {
  const { school } = params;

  let adminData: any;
  try {
    const response = await axios.get(
      `${baseUrl}/api/v1/getSubdomainList/${school}`
    );
    adminData = response.data[0];
  } catch (error) {
    console.error("Error fetching subdomain list:", error);
    return <div>Error loading school data.</div>;
  }

  // For production, don't include process.env.PORT in URL
  const url = `http://${school}.${rootDomain}`;

  return <JoinLinkClient url={url} />;
}
