import JoinLinkClient from "../../widgets/JoinLinkClient"; // import the client component
interface Props {
  params: {
    school: string;
  };
}

const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

export default async function JoinLink({ params }: Props) {
  const { school } = params;

  const url = `http://${school}.${rootDomain}:${process.env.PORT}`;

  return <JoinLinkClient url={url} />;
}
