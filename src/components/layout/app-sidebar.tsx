"use client";

import * as React from "react";
import {
  IconCards,
  IconChartBar,
  IconClock,
  IconDashboard,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";

import { NavMain } from "@/components/layout/nav-main";
import { NavSecondary } from "@/components/layout/nav-secondary";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";

const data = {
  navMain: [
    {
      title: "Tableau de bord",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Historique",
      url: "/history",
      icon: IconClock,
    },
  ],
  navSecondary: [
    {
      title: "Paramètres",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Aide",
      url: "/help",
      icon: IconHelp,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = useSession();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <span>
                <IconCards className="!size-icon" />
                <span className="text-base font-semibold">LaMap241</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: session.data?.user?.name ?? "",
            email: session.data?.user?.email ?? "",
            avatar: session.data?.user?.image ?? "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
