import { redirect } from "next/navigation"

export default async function LegacyFindingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/dashboard/resolve/${id}`)
}
