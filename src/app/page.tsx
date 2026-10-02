import { Anchor, Container, Stack, Text, Title } from "@mantine/core";
import { CurrencyConverter } from "@/features/currency-converter";

export default function HomePage() {
  return (
    <Container size={640} py={{ base: "xl", sm: 80 }}>
      <Stack gap="xl">
        <Stack gap={4}>
          <Title order={1}>Currency converter</Title>
          <Text c="dimmed">Pick two currencies and type an amount to see the conversion.</Text>
        </Stack>

        <CurrencyConverter />

        <Text size="xs" c="dimmed" ta="center">
          Exchange rates provided by{" "}
          <Anchor href="https://currencybeacon.com" target="_blank" rel="noreferrer" inherit>
            CurrencyBeacon
          </Anchor>
          . Rates are for information only.
        </Text>
      </Stack>
    </Container>
  );
}
