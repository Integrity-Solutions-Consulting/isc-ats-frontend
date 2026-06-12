import { VacancyEditPage } from "@/features/vacancies/components/VacancyEditPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VacancyEditPage id={id} />;
}
