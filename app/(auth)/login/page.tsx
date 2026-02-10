import LoginPage from "@/views/login/ui";
import { requireUnAuth } from "@/shared/lib/check-auth";

export default async function Login() {
  await requireUnAuth();
  return <LoginPage />;
}
