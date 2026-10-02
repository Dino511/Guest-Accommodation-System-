import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

// Which sections are folded is remembered per browser. The server always
// renders them open, so the first paint matches (SSR-safe).
const STORAGE_KEY = 'sidebar-closed-sections';
const CHANGE_EVENT = 'sidebar-sections-change';

function readClosed(): string {
    try {
        return localStorage.getItem(STORAGE_KEY) ?? '[]';
    } catch {
        return '[]';
    }
}

function subscribe(onChange: () => void): () => void {
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener('storage', onChange);

    return () => {
        window.removeEventListener(CHANGE_EVENT, onChange);
        window.removeEventListener('storage', onChange);
    };
}

function useSectionOpen(label: string): [boolean, (open: boolean) => void] {
    const closed: string[] = JSON.parse(
        useSyncExternalStore(subscribe, readClosed, () => '[]'),
    );

    const setOpen = (open: boolean) => {
        const next = closed.filter((name) => name !== label);

        if (!open) {
            next.push(label);
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Storage is blocked: the section still toggles until reload.
        }

        window.dispatchEvent(new Event(CHANGE_EVENT));
    };

    return [!closed.includes(label), setOpen];
}

export function NavMain({
    items,
    label = 'Platform',
}: {
    items: NavItem[];
    label?: string;
}) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const { state, isMobile } = useSidebar();
    const [open, setOpen] = useSectionOpen(label);

    // The icon-only sidebar hides the section labels, so it shows every item.
    const iconsOnly = state === 'collapsed' && !isMobile;

    return (
        <Collapsible
            open={open || iconsOnly}
            onOpenChange={setOpen}
            className="group/section"
        >
            <SidebarGroup className="px-2 py-0">
                <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="w-full cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                        {label}
                        <ChevronDown className="ml-auto transition-transform group-data-[state=closed]/section:-rotate-90" />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                    <SidebarMenu>
                        {items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={
                                        item.matchChildren
                                            ? isCurrentOrParentUrl(item.href)
                                            : isCurrentUrl(item.href)
                                    }
                                    tooltip={{ children: item.title }}
                                >
                                    {/* No hover prefetch: the dev server handles one
                                        request at a time, so prefetches queued ahead of
                                        the real click and made navigation feel stuck. */}
                                    <Link href={item.href}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}
