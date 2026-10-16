import { redirect } from "next/navigation";

/** Middleware already routes auth; keep a simple fallback. */
export default function Home() {
  redirect("/documents");
}
