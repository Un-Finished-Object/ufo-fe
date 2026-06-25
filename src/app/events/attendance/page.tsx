import { noIndexMetadata } from "@/lib/metadata";
import AttendanceCheckInScreen from "@/features/attendance/screens/AttendanceCheckInScreen";

export const metadata = noIndexMetadata;

export default function AttendancePage() {
  return <AttendanceCheckInScreen />;
}
