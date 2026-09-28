import type { ReactNode, ButtonHTMLAttributes } from "react";

/** Line icon from the firm's set (Lucide, 1.5px stroke). Inherits `color`. */
export type IconName =
  | "scale" | "gavel" | "file-text" | "stamp" | "car" | "users" | "landmark" | "shield-check"
  | "phone" | "map-pin" | "handshake" | "clock" | "message-circle" | "arrow-right" | "file-badge";
export interface IconProps { name: IconName; size?: number; strokeWidth?: number; label?: string; className?: string; }
export declare function Icon(props: IconProps): JSX.Element;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary: once per view, nogal fill. secondary (default): outlined. quiet: text only. */
  variant?: "primary" | "secondary" | "quiet";
  /** Trailing icon, e.g. "arrow-right". */
  icon?: IconName;
  children: ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;

export interface TagProps { tone?: "nogal" | "tinta" | "exito" | "aviso" | "error"; icon?: IconName; children: ReactNode; className?: string; }
export declare function Tag(props: TagProps): JSX.Element;

export interface ServiceCardProps {
  icon?: IconName;
  /** Practice area in tracked caps, e.g. "Derecho de familia". */
  area?: string;
  title: ReactNode;
  /** Sub-services, 3–6 short lines. */
  items?: string[];
  footer?: ReactNode;
  className?: string;
}
export declare function ServiceCard(props: ServiceCardProps): JSX.Element;

export interface CalloutProps { children: ReactNode; /** Legal citation, e.g. "Art. 411, Código Civil". */ cite?: string; className?: string; }
export declare function Callout(props: CalloutProps): JSX.Element;

export interface ContactCardProps { title?: string; phones: string[]; address?: string; handle?: string; className?: string; }
export declare function ContactCard(props: ContactCardProps): JSX.Element;

export interface CarouselSlideProps {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  /** light (default): ivory card. dark: nogal-strong card for the closing slide. */
  tone?: "light" | "dark";
  /** false hides the "next" arrow (last slide). */
  next?: boolean;
  handle?: string;
  className?: string;
}
export declare function CarouselSlide(props: CarouselSlideProps): JSX.Element;
