"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { kitConfig } from "@/kit.config";

const nav = [
  { href: "/", label: "Overview", icon: OverviewIcon },
  { href: "/workflows", label: "Workflows", icon: WorkflowsIcon },
  { href: "/executions", label: "Executions", icon: ExecutionsIcon },
  { href: "/credentials", label: "Credentials", icon: CredentialsIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL ?? "http://localhost:5678";

  return (
    <aside className="hidden h-full w-[260px] shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
      <div className="shrink-0 px-6 py-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#0E7C5C] text-base font-bold text-white shadow-sm">
            {kitConfig.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-gray-900">
              {kitConfig.name}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Automation Console
            </p>
          </div>
        </div>
      </div>

      <div className="app-scroll min-h-0 flex-1 overflow-y-auto px-4">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Menu
        </p>
        <nav className="flex flex-col gap-1 pb-4">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px] transition ${
                  active
                    ? "bg-[#E4F3EC] font-bold text-gray-900"
                    : "font-medium text-gray-500 hover:bg-[#FAFAF9] hover:text-gray-800"
                }`}
              >
                {active && (
                  <span className="absolute -left-4 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#0E7C5C]" />
                )}
                <Icon active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 border-t border-gray-100 p-5">
        <a
          href={n8nUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0E7C5C] px-4 py-3.5 text-sm font-bold text-white shadow-card transition hover:bg-[#0B6B4F]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Open n8n editor ↗
        </a>
      </div>
    </aside>
  );
}

function OverviewIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-[18px] w-[18px] ${active ? "text-[#0E7C5C]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );
}

function WorkflowsIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-[18px] w-[18px] ${active ? "text-[#0E7C5C]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ExecutionsIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-[18px] w-[18px] ${active ? "text-[#0E7C5C]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function CredentialsIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-[18px] w-[18px] ${active ? "text-[#0E7C5C]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 11-4 0 2 2 0 014 0zM6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-[18px] w-[18px] ${active ? "text-[#0E7C5C]" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
