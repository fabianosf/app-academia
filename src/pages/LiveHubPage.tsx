import { useState } from "react";
import { liveClasses } from "@/data/mock";
import { LiveClassCard } from "@/components/Cards";
import { PageHeader } from "@/components/ShellBits";

const tabs = [
  { id: "live", label: "Ao vivo agora" },
  { id: "upcoming", label: "Próximas aulas" },
  { id: "mine", label: "Minhas reservas" },
  { id: "recorded", label: "Aulas gravadas" },
] as const;

export function LiveHubPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("upcoming");
  const list = liveClasses.filter((c) => {
    if (tab === "live") return c.status === "live";
    if (tab === "upcoming") return c.status === "upcoming";
    if (tab === "recorded") return c.status === "recorded";
    return c.id === "c2";
  });
  return (
    <div>
      <PageHeader title="Ao vivo" subtitle="Aulas guiadas com vagas limitadas. A sala é uma interface demonstrativa." />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1.5 text-sm ${tab === t.id ? "bg-stone-900 text-white" : "bg-white text-stone-600"}`}>{t.label}</button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((item) => <LiveClassCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}
