import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function DashboardAgendaPage() {
  return (
    <main className="module-placeholder-page">
      <section className="container module-placeholder-shell">
        <Link href="/dashboard#agenda" className="brand">
          <BrandLogo />
        </Link>

        <article className="card module-placeholder-card">
          <span className="eyebrow">
            <CalendarDays size={16} />
            Agenda
          </span>
          <h1>Agenda projet</h1>
          <p className="muted">Jalons, échéances et relances partagées seront centralisés ici.</p>
          <button className="button accent" type="button">
            <Plus size={18} />
            Ajouter
          </button>
        </article>
      </section>
    </main>
  );
}
