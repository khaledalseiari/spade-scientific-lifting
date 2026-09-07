import Link from "next/link";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";

type Variant = "primary" | "accent" | "support" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  // Dark backgrounds (primary/accent) verified 7:1+ contrast with white text — see BRAND.md.
  primary: "bg-brand-primary text-white hover:bg-brand-primary/90",
  accent: "bg-brand-accent text-white hover:bg-brand-accent/90",
  // Light backgrounds (support) always take dark text — never white — see BRAND.md.
  support: "bg-brand-support text-brand-ink hover:bg-brand-support/80",
  outline:
    "border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white",
  ghost: "text-brand-primary hover:bg-brand-primary/10",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  /** Shows a spinner and disables the button — pass your form's isSubmitting here. */
  loading?: boolean;
};

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkButtonProps = BaseProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >;

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading,
  ...props
}: ButtonProps | LinkButtonProps) {
  const classes = cn(base, variantClasses[variant], sizeClasses[size], className);

  if ("href" in props && props.href) {
    const { href, ...rest } = props as LinkButtonProps;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      className={classes}
      disabled={loading || buttonProps.disabled}
      aria-busy={loading}
      {...buttonProps}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
