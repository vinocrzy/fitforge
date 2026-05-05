import { BarcodeConfirmScreen } from './BarcodeConfirmScreen';

interface Props {
  searchParams: Promise<{
    slot?: string; date?: string; name?: string; brand?: string;
    barcode?: string; cal?: string; prot?: string; carb?: string; fat?: string;
  }>;
}

export default async function BarcodeConfirmPage({ searchParams }: Props) {
  const params = await searchParams;
  return <BarcodeConfirmScreen {...params} />;
}
