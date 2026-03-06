export function StatsBar() {
  const stats = [
    { value: "Day-by-day", label: "Itinerary Builder" },
    { value: "Shared", label: "Collaborative Access" },
    { value: "Expense splits", label: "Budget Tracking" },
    { value: "Cloudinary", label: "File Storage" },
  ];

  return (
    <section className="border-y-2 border-[#1A1A1A] bg-[#111111] py-7 px-6">
      <div className="max-w-[1100px] mx-auto flex justify-around items-center gap-6 flex-wrap">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center py-1 px-4">
            <div className="font-display font-extrabold text-lg text-[#93CDFF] tracking-tight">
              {stat.value}
            </div>
            <div className="text-xs text-gray-400 font-medium mt-0.5">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
