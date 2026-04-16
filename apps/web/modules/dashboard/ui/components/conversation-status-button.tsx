import { Doc } from "@workspace/backend/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ArrowRightIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon } from "lucide-react";

type Status = Doc<"conversations">["status"];

const STATUS_CONFIG: Record<
  Status,
  { label: string; icon: React.ReactNode; variant: "tertiary" | "warning" | "destructive" }
> = {
  resolved: {
    label: "Resolved",
    icon: <CheckIcon className="size-4" />,
    variant: "tertiary",
  },
  escalated: {
    label: "Escalated",
    icon: <ArrowUpIcon className="size-4" />,
    variant: "warning",
  },
  unresolved: {
    label: "Unresolved",
    icon: <ArrowRightIcon className="size-4" />,
    variant: "destructive",
  },
};

const ALL_STATUSES: Status[] = ["unresolved", "escalated", "resolved"];

export const ConversationStatusButton = ({
  status,
  onStatusChange,
  disabled,
}: {
  status: Status;
  onStatusChange: (status: Status) => void;
  disabled?: boolean;
}) => {
  const current = STATUS_CONFIG[status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={disabled} size="sm" variant={current.variant}>
          {current.icon}
          {current.label}
          <ChevronDownIcon className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ALL_STATUSES.filter((s) => s !== status).map((s) => {
          const config = STATUS_CONFIG[s];
          return (
            <DropdownMenuItem key={s} onClick={() => onStatusChange(s)}>
              {config.icon}
              {config.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
