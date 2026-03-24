import { redirect } from "next/navigation";

export default async function PessoalPage() {
  redirect("/gerenciar?tab=pessoal");
}
