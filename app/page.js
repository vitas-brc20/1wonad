import { getLatestMessage } from "@/app/actions";
import Billboard from "@/app/components/Billboard";

export default async function Home() {
  const latestMessage = await getLatestMessage();

  return <Billboard initialMessage={latestMessage} />;
}