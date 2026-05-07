import { BarcodeScreen } from '@/components/diet/BarcodeScreen';

interface Props {
  searchParams: Promise<{ slot?: string; date?: string }>;
}

export default async function BarcodePage({ searchParams }: Props) {
  const { slot = 'breakfast', date = new Date().toISOString().slice(0, 10) } = await searchParams;
  return <BarcodeScreen slot={slot} date={date} />;
}
