"use client";

import { Folder, FileText, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type Crumb = { id: string; name: string; href?: string };

type Props = {
  crumbs: Crumb[];
  currentLabel?: string;
  currentIcon?: "folder" | "file";
};

export function DocumentsNavBreadcrumb({
  crumbs,
  currentLabel,
  currentIcon = "folder",
}: Props) {
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            href="/documents"
            className="inline-flex items-center gap-1.5"
          >
            <Home size={16} strokeWidth={2} aria-hidden="true" />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>

        {crumbs.map((crumb) => (
          <span key={crumb.id} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink
                  href={crumb.href}
                  className="inline-flex items-center gap-1.5"
                >
                  <Folder size={16} strokeWidth={2} aria-hidden="true" />
                  {crumb.name}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="inline-flex items-center gap-1.5">
                  <Folder size={16} strokeWidth={2} aria-hidden="true" />
                  {crumb.name}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </span>
        ))}

        {currentLabel ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="inline-flex items-center gap-1.5">
                {currentIcon === "file" ? (
                  <FileText size={16} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Folder size={16} strokeWidth={2} aria-hidden="true" />
                )}
                {currentLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
