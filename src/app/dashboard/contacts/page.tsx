import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function DashboardContactsPage() {
  return (
    <main className="module-placeholder-page">
      <section className="container module-placeholder-shell">
        <Link href="/dashboard#contacts" className="brand">
          <BrandLogo />
        </Link>

        <article className="card module-placeholder-card">
          <span className="eyebrow">
            <Users size={16} />
            Contacts
          </span>
          <h1>Contacts</h1>
          <p className="muted">Partenaires, fournisseurs et intervenants du projet seront réunis ici.</p>
          <button className="button accent" type="button">
            <Plus size={18} />
            Ajouter
          </button>
        </article>
      </section>
    </main>
  );
}
