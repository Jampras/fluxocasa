import { redirect } from "next/navigation";

export default async function PessoalPage() {
  redirect("/dashboard?tab=pessoal");
}
