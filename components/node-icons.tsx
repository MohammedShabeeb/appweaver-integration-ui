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

export function SetBodyIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 6h8" />
      <path d="M5 10h14" />
      <path d="M5 14h10" />
      <path d="M13 18h6" />
      <path d="m16 15 3 3-3 3" />
    </BaseIcon>
  );
}

export function SetHeaderIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 6h14" />
      <path d="M5 10h6" />
      <path d="M13 10h6" />
      <path d="M5 14h14" />
      <path d="M8 18h8" />
      <path d="m14 16 2 2-2 2" />
    </BaseIcon>
  );
}

export function SetPropertyIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 7h8" />
      <path d="M5 12h6" />
      <path d="M5 17h8" />
      <path d="M16 7h3" />
      <path d="M16 12h3" />
      <path d="M16 17h3" />
      <path d="M13 7h.01" />
      <path d="M13 12h.01" />
      <path d="M13 17h.01" />
    </BaseIcon>
  );
}

export function ConvertBodyToIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 6h8" />
      <path d="M5 11h6" />
      <path d="M5 16h8" />
      <path d="M15 8h4" />
      <path d="m17 6 2 2-2 2" />
      <path d="M15 16h4" />
      <path d="m17 14 2 2-2 2" />
    </BaseIcon>
  );
}

export function TransformIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 7h6" />
      <path d="M5 17h6" />
      <path d="M13 7h6" />
      <path d="M13 17h6" />
      <path d="m9 10 3 2-3 2" />
      <path d="m15 10-3 2 3 2" />
    </BaseIcon>
  );
}

export function UnmarshalIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 5h12" />
      <path d="M6 9h12" />
      <path d="M6 13h7" />
      <path d="M15 14v5" />
      <path d="m12 16 3 3 3-3" />
    </BaseIcon>
  );
}

export function ValidateIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3 5 6v5c0 4.5 3 7.5 7 10 4-2.5 7-5.5 7-10V6z" />
      <path d="m9 12 2 2 4-5" />
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

export function LogIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 6h14" />
      <path d="M5 10h10" />
      <path d="M5 14h12" />
      <path d="M5 18h7" />
      <circle cx="18" cy="18" r="2" />
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
  setBody: {
    label: "Set Body",
    Icon: SetBodyIcon,
  },
  setHeader: {
    label: "Set Header",
    Icon: SetHeaderIcon,
  },
  setProperty: {
    label: "Set Property",
    Icon: SetPropertyIcon,
  },
  convertBodyTo: {
    label: "Convert Body",
    Icon: ConvertBodyToIcon,
  },
  transform: {
    label: "Transform",
    Icon: TransformIcon,
  },
  unmarshal: {
    label: "Unmarshal",
    Icon: UnmarshalIcon,
  },
  validate: {
    label: "Validate",
    Icon: ValidateIcon,
  },
  process: {
    label: "Process",
    Icon: ProcessIcon,
  },
  log: {
    label: "Log",
    Icon: LogIcon,
  },
} as const;
