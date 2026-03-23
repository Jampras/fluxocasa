import { redirect } from "next/navigation";

export default async function CasaPage() {
  redirect("/dashboard?tab=casa");
}
