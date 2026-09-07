import Link from "next/link";
import { slabDealsSnapshot } from "./deals.generated";
import SlabDealsDashboard from "./slab-deals-dashboard";

export default function SlabDealsPage() {
  return (
    <main className="internal-research-shell wide dealer-shell">
      <header className="internal-research-header">
        <Link href="/internal">← Research tools</Link>
        <span>No automatic purchases · manual approval required</span>
      </header>
      <section className="dealer-heading">
        <div>
          <p>POCKET ARCHIVES · DEALER BUYING ASSISTANT</p>
          <h1>Slab Deals</h1>
        </div>
        <dl>
          <div><dt>Ceiling</dt><dd>${slabDealsSnapshot.policy.maximumSlabAsk}</dd></div>
          <div><dt>Min. profit</dt><dd>${slabDealsSnapshot.policy.minimumProfit}</dd></div>
          <div><dt>Min. ROI</dt><dd>{slabDealsSnapshot.policy.minimumRoiPercent}%</dd></div>
        </dl>
      </section>
      <SlabDealsDashboard snapshot={slabDealsSnapshot} />
    </main>
  );
}
