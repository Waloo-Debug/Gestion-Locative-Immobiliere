import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5", className)}
    >
      <ArrowLeft data-icon="inline-start" />
      {label}
    </Link>
  );
}
