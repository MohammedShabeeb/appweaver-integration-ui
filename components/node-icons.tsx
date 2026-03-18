import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export function FromIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M10 9.5 15 12l-5 2.5z" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function HttpIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="3" />
      <path d="M7 10h10" />
      <path d="M7 14h6" />
      <circle cx="17" cy="14" r="1" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function DelayIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2.5" />
    </BaseIcon>
  );
}

export function ContainerIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M4 10h16" />
      <path d="M9 6V4.5h6V6" />
    </BaseIcon>
  );
}

export function ConnectorIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="12" r="2.5" />
      <path d="M8.5 12h7" />
    </BaseIcon>
  );
}

export const nodeTypeMeta = {
  start: {
    label: "From",
    Icon: FromIcon,
  },
  http: {
    label: "HTTP Request",
    Icon: HttpIcon,
  },
  delay: {
    label: "Delay",
    Icon: DelayIcon,
  },
  container: {
    label: "Container",
    Icon: ContainerIcon,
  },
} as const;
