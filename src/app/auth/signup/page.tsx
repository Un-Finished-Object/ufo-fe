import OAuthRedirectGuard from "@/features/auth/components/OAuthRedirectGuard";
import SignupScreen from "@/features/auth/screens/SignupScreen";

export default function SignupPage() {
  return (
    <OAuthRedirectGuard>
      <SignupScreen />
    </OAuthRedirectGuard>
  );
}
