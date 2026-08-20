import type { AnchorHTMLAttributes, MouseEvent as ReactMouseEvent } from "react";
import { navigateTo } from "../shared/helpers";
type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
export function Link({ href, onClick, ...props }: LinkProps) {
  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigateTo(href);
  };
  return <a href={href} onClick={handleClick} {...props} />;
}
