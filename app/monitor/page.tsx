import PediatricMonitor from "@/components/monitor/PediatricMonitor";

export const metadata = {
  title: "Pediatric Bedside Monitor Prototype",
  description: "Device-independent pediatric rhythm monitor prototype driven by a canonical cardiac event clock.",
};

export default function MonitorPage() {
  return <PediatricMonitor />;
}
