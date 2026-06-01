import { redirect } from "next/navigation";

export default function RedirectToAdmin() {
  redirect("/admin");
}
