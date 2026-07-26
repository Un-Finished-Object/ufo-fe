import CreditHistoryScreen from "@/features/my/screens/CreditHistoryScreen";
export default function MyCreditsPage() {
  return (
    <CreditHistoryScreen
      initialPage={1}
      initialType="all"
      initialReason="all"
    />
  );
}
