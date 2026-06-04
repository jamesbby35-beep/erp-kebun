import { redirect } from "next/navigation";

export default function RootPage() {
  // Langsung melempar user ke halaman dashboard utama saat web diakses
  redirect("/dashboard");
}