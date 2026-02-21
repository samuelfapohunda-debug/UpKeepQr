import { useMemo } from "react";

interface AnnouncementItem {
  id: string;
  text: string;
}

interface ScrollingAnnouncementProps {
  items?: AnnouncementItem[];
  speed?: number;
}

const defaultItems: AnnouncementItem[] = [
  { id: "1", text: "Trusted by 100+ Realtor subscriptions in North America" },
  { id: "2", text: "5,000+ homeowners never miss maintenance tasks" },
  { id: "3", text: "Smart QR codes track your home's entire service history" },
  { id: "4", text: "Climate-aware reminders for seasonal maintenance" },
  { id: "5", text: "Setup in under 2 minutes - 30 days free" },
];

export default function ScrollingAnnouncement({
  items = defaultItems,
  speed = 40,
}: ScrollingAnnouncementProps) {
  const duplicated = useMemo(() => [...items, ...items], [items]);

  return (
    <section
      className="relative w-full overflow-hidden border-y border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 py-3"
      data-testid="section-scrolling-announcement"
    >
      <div className="absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none sm:w-24" />
      <div className="absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none sm:w-24" />

      <div
        className="inline-flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused]"
        style={{ animationDuration: `${speed}s` }}
      >
        {duplicated.map((item, index) => (
          <span
            key={`${item.id}-${index}`}
            className="inline-flex items-center px-6 text-sm font-medium text-slate-600 sm:px-10 sm:text-base"
          >
            {item.text}
            <span className="ml-6 text-lg font-bold text-emerald-500 sm:ml-10" aria-hidden="true">
              {"\u2022"}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
