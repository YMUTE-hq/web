import LogoLoader from "@/components/ui/LogoLoader";

export default function DashboardLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center p-12 bg-background-light">
      <LogoLoader size="lg" label="Loading Dashboard..." />
    </div>
  );
}
