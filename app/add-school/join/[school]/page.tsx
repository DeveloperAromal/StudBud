import JoinLinkClient from "../../widgets/JoinLinkClient"; // import the client component
export default async function JoinLink({
  params,
}: {
  params: { school: string };
}) {
  const { school } = params;
  const url = `http://${school}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}:${process.env.PORT}`;

  return <JoinLinkClient url={url} />;
}
