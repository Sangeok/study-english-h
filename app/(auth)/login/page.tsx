import LoginPage from "@/views/login/ui";
import { requireUnAuth } from "@/shared/lib";

export default async function Login() {
  await requireUnAuth();
  return <LoginPage />;
}
