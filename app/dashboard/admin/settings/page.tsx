import { AdminService } from "@/backend/services/AdminService";
import { AdminSettingToggle, AdminSettingInput } from "@/components/admin/AdminActions";
import { Settings } from "lucide-react";

import { PlatformSetting } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = (await AdminService.getSettings() || []) as PlatformSetting[];
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const toggleSettings = [
    { key: "registration_enabled", label: "Allow New Registrations", description: "Enable or disable all new user sign-ups" },
    { key: "caster_registration_enabled", label: "Caster Registrations", description: "Enable or disable caster-specific sign-ups" },
    { key: "company_registration_enabled", label: "Company Registrations", description: "Enable or disable company-specific sign-ups" },
    { key: "require_job_approval", label: "Require Job Approval", description: "Admin must approve each job before it goes live" },
    { key: "feature_community", label: "Community Section", description: "Show or hide the community/social area" },
    { key: "feature_games", label: "Games Section", description: "Show or hide the games and leaderboard section" },
  ];

  const inputSettings = [
    { key: "job_posting_limit", label: "Job Posting Limit (per company)", description: "Maximum active jobs a company can post at once", type: "number" },
    { key: "commission_percent", label: "Platform Commission (%)", description: "Percentage charged on each paid transaction", type: "number" },
  ];

  return (
    <main className="flex-1 h-full overflow-y-auto p-8 lg:p-12">
      <header className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Platform Settings</h2>
        <p className="text-slate-500 mt-1">Control platform behavior without code changes</p>
      </header>

      {settings.length === 0 ? (
        <div className="clay-card shadow-clay rounded-xl bg-white p-12 text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 text-slate-200" />
          <p className="text-slate-500 font-semibold">No settings found.</p>
          <p className="text-sm text-slate-400 mt-2">Please run the migration SQL in Supabase to create the platform_settings table.</p>
        </div>
      ) : (
        <>
          <section className="mb-10">
            <h3 className="text-base font-black text-slate-700 mb-4 uppercase tracking-widest">Feature Toggles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toggleSettings.map((s) => (
                <AdminSettingToggle
                  key={s.key}
                  settingKey={s.key}
                  currentValue={settingsMap[s.key] || "true"}
                  label={s.label}
                  description={s.description}
                />
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-base font-black text-slate-700 mb-4 uppercase tracking-widest">Platform Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputSettings.map((s) => (
                <AdminSettingInput
                  key={s.key}
                  settingKey={s.key}
                  currentValue={settingsMap[s.key] || ""}
                  label={s.label}
                  description={s.description}
                  type={s.type}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
