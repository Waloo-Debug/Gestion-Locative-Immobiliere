import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ViewLink({
  href,
  className,
  label = "Voir",
}: {
  href: string;
  className?: string;
  label?: string;
}) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}>
      {label}
    </Link>
  );
}
