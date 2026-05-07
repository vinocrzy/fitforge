import { CustomFoodForm } from '@/components/diet/CustomFoodForm';

interface Props {
  searchParams: Promise<{ slot?: string; date?: string }>;
}

export default async function NewFoodPage({ searchParams }: Props) {
  const { slot = 'breakfast', date = new Date().toISOString().slice(0, 10) } = await searchParams;
  return <CustomFoodForm slot={slot} date={date} />;
}
