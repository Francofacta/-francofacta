import Link from "next/link";

const legalLinks = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/politique-confidentialite", label: "Politique de confidentialité" },
  { href: "/cgv", label: "CGV" }
];

export function LegalFooter() {
  return (
    <footer className="legal-footer">
      <div className="container legal-footer-inner">
        <span>© FrancoFacta</span>
        <nav aria-label="Liens légaux">
          {legalLinks.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
