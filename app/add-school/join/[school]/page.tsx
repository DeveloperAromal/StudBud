import JoinLinkClient from "../../widgets/JoinLinkClient";

interface PageProps {
  params: {
    school: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

export default function JoinLink({ params }: PageProps) {
  const { school } = params;

  const isDev = process.env.NODE_ENV === "development";
  const url = isDev
    ? `http://${school}.${rootDomain}:${process.env.PORT}`
    : `https://${school}.${rootDomain}`;

  return <JoinLinkClient url={url} />;
}
