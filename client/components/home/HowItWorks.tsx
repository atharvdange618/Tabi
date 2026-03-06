const steps = [
  {
    num: "01",
    bg: "bg-[#93CDFF]",
    title: "Create your trip",
    desc: "Name it, set dates, pick a destination. Takes about 30 seconds. Your trip dashboard is ready immediately.",
  },
  {
    num: "02",
    bg: "bg-[#B8F0D4]",
    title: "Invite your crew",
    desc: "Share an invite link or add by email. Assign roles admins edit everything, editors contribute, viewers just follow along.",
  },
  {
    num: "03",
    bg: "bg-[#FFD6C0]",
    title: "Build together",
    desc: "Add activities day by day, log expenses as they happen, upload docs, comment, and check off tasks everything lives in one shared space your whole group can access.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t-2 border-[#1A1A1A] bg-white py-[100px] px-6">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-16">
          <span className="badge inline-flex bg-[#FFD6C0] mb-4">
            Dead simple
          </span>
          <h2 className="font-display font-extrabold text-[clamp(32px,4vw,48px)] tracking-tight text-[#111111] uppercase m-0 text-balance">
            Up in three steps.
          </h2>
        </div>

        <div className="flex flex-col gap-0 relative">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`flex gap-7 items-start p-9 border-2 border-[#1A1A1A] rounded-xl bg-white shadow-[4px_4px_0px_#1A1A1A] ${i < 2 ? "mb-5" : "mb-0"}`}
            >
              <div className={`step-number ${step.bg}`}>{step.num}</div>
              <div>
                <h3 className="font-display font-bold text-[22px] mb-2 text-[#111]">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-[15px] leading-relaxed font-medium m-0 max-w-[560px]">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
