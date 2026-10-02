import { Alert, Button, Group, Text } from "@mantine/core";

interface ErrorAlertProps {
  title: string;
  error: Error;
  onRetry: () => void;
}

export function ErrorAlert({ title, error, onRetry }: ErrorAlertProps) {
  return (
    <Alert color="red" variant="light" title={title}>
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text size="sm">{error.message}</Text>
        <Button size="xs" variant="white" color="red" onClick={onRetry}>
          Try again
        </Button>
      </Group>
    </Alert>
  );
}
