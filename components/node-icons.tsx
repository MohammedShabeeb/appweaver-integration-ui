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

export function MarshalIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 6h10" />
      <path d="M7 10h10" />
      <path d="M7 14h7" />
      <path d="m14 17 3 3 3-3" />
    </BaseIcon>
  );
}

export function UnmarshalIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 8h10" />
      <path d="M7 12h10" />
      <path d="M7 16h7" />
      <path d="m14 7 3-3 3 3" />
    </BaseIcon>
  );
}

export function ProcessIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M8 9.5h8" />
      <path d="M8 13h5" />
      <circle cx="16.5" cy="13" r="1" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function ActionIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M8 9.5h8" />
      <path d="M8 13h5" />
      <circle cx="16.5" cy="13" r="1" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function SwitchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4 L20 12 L12 20 L4 12 Z" />
      <path d="M12 9v6" />
      <path d="M9 12h6" />
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
  marshal: {
    label: "Marshal",
    Icon: MarshalIcon,
  },
  unmarshal: {
    label: "Unmarshal",
    Icon: UnmarshalIcon,
  },
  process: {
    label: "Process",
    Icon: ProcessIcon,
  },
} as const;
