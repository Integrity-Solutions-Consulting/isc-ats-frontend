import { ProcesoEditorPage } from '@/features/processes/components/ProcesoEditorPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProcesoEditorPage id={id} />;
}
