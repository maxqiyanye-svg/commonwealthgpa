// Small fixed "Made by Caliber Studio" credit, bottom-left on every page.
// Lives in the root layout so it shows up everywhere without being added
// to each page individually.
export default function MadeByBadge() {
  return (
    <div className="fixed bottom-4 left-4 z-50 card px-3 py-1.5 text-xs text-ink-muted">
      Made by{" "}
      <a
        href="https://builtbycaliber.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        className="text-ink-secondary underline hover:text-accent"
      >
        Caliber Studio
      </a>
    </div>
  );
}
