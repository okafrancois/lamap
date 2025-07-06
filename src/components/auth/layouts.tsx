import { routes } from "@/lib/routes";
import { AppSidebar } from "../app-sidebar";
import { SiteHeader } from "../site-header";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export const AuthenticatedLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const session = await auth();

  if (!session) {
    return redirect(routes.login);
  }

  return (
    <>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar user={session.user} variant="inset" />
        <SidebarInset className="bg-background overflow-hidden">
          <SiteHeader />
          <div className="relative flex-1">
            <div className="absolute inset-0 overflow-y-scroll py-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
};
