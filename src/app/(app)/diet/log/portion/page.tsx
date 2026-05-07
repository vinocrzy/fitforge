import { PortionPickerScreen } from '@/components/diet/PortionPickerScreen';

interface Props {
  searchParams: Promise<{ foodId?: string; slot?: string; date?: string; name?: string; custom?: string }>;
}

export default async function PortionPickerPage({ searchParams }: Props) {
  const params = await searchParams;
  return <PortionPickerScreen
    foodId={params.foodId ?? ''}
    slot={params.slot ?? 'breakfast'}
    date={params.date ?? new Date().toISOString().slice(0, 10)}
    foodName={decodeURIComponent(params.name ?? '')}
    isCustom={params.custom === 'true'}
  />;
}
