import { createFileRoute } from "@tanstack/react-router";
import { users } from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";
import { Mail, Plus, Shield } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

function Admin() {
  return (
    <div>
      <PageHeader
        eyebrow="Restricted"
        title="Admin"
        description="Seth-only: invite team members, assign roles, and manage archived records."
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Invite by email
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="font-display text-lg">Team members</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Responsibilities</th>
                <th className="px-4 py-3 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {u.initials}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="status-pill">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.title}</td>
                  <td className="px-4 py-3">
                    <button className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Mail className="h-3.5 w-3.5" /> Send message
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-[color:var(--gold)]">
              <Shield className="h-3.5 w-3.5" /> Access model
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="font-medium text-foreground">Seth</span> — create, edit, upload, assign, resolve.</li>
              <li><span className="font-medium text-foreground">Perry</span> — review, approve, request changes.</li>
              <li><span className="font-medium text-foreground">Rena</span> — approved creator & sample materials only.</li>
              <li><span className="font-medium text-foreground">Tuan</span> — approved technical & Shopify materials.</li>
              <li><span className="font-medium text-foreground">Hoang</span> — read/comment until role is finalized.</li>
            </ul>
          </div>
          <div className="rounded-lg border border-dashed border-border bg-card p-5 text-xs text-muted-foreground">
            Emails are hidden from non-admin views. Row-level security and file access controls apply once Lovable Cloud is connected in step 3 of the build.
          </div>
        </aside>
      </div>
    </div>
  );
}
