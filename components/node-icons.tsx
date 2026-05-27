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

export function SetContextIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
      <path d="M15 13h1.5" />
      <path d="M8 17h8" />
    </BaseIcon>
  );
}

export function GlobalOptionIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
      <path d="M15 14h1" />
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

export function FilterIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 5h16" />
      <path d="M7 10h10" />
      <path d="M10 15h4" />
      <path d="M12 15v4" />
    </BaseIcon>
  );
}

export function DynamicRouteIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 7h6" />
      <path d="M13 7h6" />
      <path d="M5 17h6" />
      <path d="M13 17h6" />
      <path d="M11 7c2 0 2 10 4 10" />
      <path d="M11 17c2 0 2-10 4-10" />
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

export function BeanIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M8 9h8" />
      <path d="M8 13h4" />
      <path d="M15 12h1.5a1.5 1.5 0 0 1 0 3H15z" />
      <path d="M8 17h8" />
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

export function DelayIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
      <path d="M5 4 3 6" />
      <path d="M19 4l2 2" />
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

export function UploadIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 16V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M5 17v2h14v-2" />
      <path d="M7 13h2" />
      <path d="M15 13h2" />
    </BaseIcon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v11" />
      <path d="m8 12 4 4 4-4" />
      <path d="M5 19h14" />
      <path d="M7 8h2" />
      <path d="M15 8h2" />
    </BaseIcon>
  );
}

export function EnrichIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 6h8" />
      <path d="M5 12h14" />
      <path d="M5 18h8" />
      <path d="M16 4v6" />
      <path d="M13 7h6" />
    </BaseIcon>
  );
}

export function DatabaseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </BaseIcon>
  );
}

export function AggregationIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 5h4v4H5z" />
      <path d="M5 15h4v4H5z" />
      <path d="M15 10h4v4h-4z" />
      <path d="M9 7h3c2 0 3 1 3 3" />
      <path d="M9 17h3c2 0 3-1 3-3" />
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
  setContext: {
    label: "Set Context",
    Icon: SetContextIcon,
  },
  globalOption: {
    label: "Global Option",
    Icon: GlobalOptionIcon,
  },
  convertBodyTo: {
    label: "Convert Body",
    Icon: ConvertBodyToIcon,
  },
  transform: {
    label: "Transform",
    Icon: TransformIcon,
  },
  filter: {
    label: "Filter",
    Icon: FilterIcon,
  },
  dynamicroute: {
    label: "Dynamic Route",
    Icon: DynamicRouteIcon,
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
  bean: {
    label: "Bean",
    Icon: BeanIcon,
  },
  upload: {
    label: "Upload",
    Icon: UploadIcon,
  },
  download: {
    label: "Download",
    Icon: DownloadIcon,
  },
  enrich: {
    label: "Enrich",
    Icon: EnrichIcon,
  },
  dbCrud: {
    label: "DB CRUD",
    Icon: DatabaseIcon,
  },
  aggregation: {
    label: "Aggregation",
    Icon: AggregationIcon,
  },
  log: {
    label: "Log",
    Icon: LogIcon,
  },
  delay: {
    label: "Delay",
    Icon: DelayIcon,
  },
} as const;
