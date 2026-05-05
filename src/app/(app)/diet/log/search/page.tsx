import { FoodSearchScreen } from './FoodSearchScreen';

interface Props {
  searchParams: Promise<{ slot?: string; date?: string }>;
}

export default async function FoodSearchPage({ searchParams }: Props) {
  const { slot = 'breakfast', date = new Date().toISOString().slice(0, 10) } = await searchParams;
  return <FoodSearchScreen slot={slot} date={date} />;
}
