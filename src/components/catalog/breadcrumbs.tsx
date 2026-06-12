import { Fragment } from "react";

import { Link } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";

export interface Crumb {
  label: string;
  href?: { pathname: AppPathname; params?: Record<string, string | string[]> };
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-vondel-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-vondel-700 hover:underline">
            Home
          </Link>
        </li>
        {crumbs.map((crumb, i) => (
          <Fragment key={i}>
            <li aria-hidden className="text-vondel-300">
              /
            </li>
            <li>
              {crumb.href && i < crumbs.length - 1 ? (
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={crumb.href as any}
                  className="hover:text-vondel-700 hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-vondel-800">
                  {crumb.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
