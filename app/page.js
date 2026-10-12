import { getLatestMessage, getNextRequiredPrice, getHallOfFame } from "@/app/actions";
import Billboard from "@/app/components/Billboard";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [latestMessage, requiredPrice, hallOfFame] = await Promise.all([
    getLatestMessage(),
    getNextRequiredPrice(),
    getHallOfFame(),
  ]);

  return (
    <Billboard 
      initialMessage={latestMessage} 
      initialRequiredPrice={requiredPrice}
      hallOfFame={hallOfFame}
    />
  );
}