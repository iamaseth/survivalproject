import { Link } from "@tanstack/react-router";
import { assets, priorityTone, userById, type Asset } from "@/lib/mock-data";
import { StatusPill } from "./StatusPill";

export function AssetList({ filter }: { filter?: (a: Asset) => boolean }) {
  const rows = filter ? assets.filter(filter) : assets;
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
        No assets in this view yet.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Version</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-secondary/40">
              <td className="px-4 py-3">
                <Link to="/assets/$id" params={{ id: a.id }} className="font-medium text-foreground hover:text-primary">
                  {a.title}
                </Link>
                <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{a.description}</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{a.category}</td>
              <td className="px-4 py-3">{userById(a.ownerId)?.name}</td>
              <td className="px-4 py-3">
                <StatusPill status={a.status} />
              </td>
              <td className={`px-4 py-3 text-xs font-medium ${priorityTone[a.priority]}`}>{a.priority}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">v{a.version}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
