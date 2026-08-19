import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE } from "@/lib/admin/session";

export const runtime = "nodejs";

/**
 * Çıkış. Yalnızca POST — GET ile durum değiştiren bir uç nokta, bir
 * <img src> etiketi veya tarayıcı ön yüklemesi tarafından tetiklenebilir
 * ve kullanıcı sebepsiz yere oturumdan düşer.
 */
export async function POST() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
