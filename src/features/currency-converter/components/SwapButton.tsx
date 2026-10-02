import { ActionIcon, Tooltip } from "@mantine/core";

export function SwapButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip label="Swap currencies" withArrow>
      <ActionIcon
        variant="light"
        size="lg"
        radius="xl"
        aria-label="Swap currencies"
        onClick={onClick}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
        </svg>
      </ActionIcon>
    </Tooltip>
  );
}
