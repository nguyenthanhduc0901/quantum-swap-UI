import { Container, Heading, Text, VStack, Button } from "@chakra-ui/react";
import NextLink from "next/link";

export default function NotFound() {
  return (
    <Container maxW="container.md" py={{ base: 8, md: 12 }}>
      <VStack
        align="stretch"
        gap={6}
        bg="rgba(23,35,53,0.6)"
        backdropFilter="blur(12px)"
        border="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        rounded="2xl"
        p={{ base: 5, md: 8 }}
        textAlign="center"
      >
        <Heading size="lg" color="white">404 - Page Not Found</Heading>
        <Text color="whiteAlpha.700">The page you are looking for does not exist.</Text>
        <NextLink href="/" passHref>
          <Button as="span" bg="brand.400" color="black" _hover={{ bg: "brand.300" }}>
            Go to Homepage
          </Button>
        </NextLink>
      </VStack>
    </Container>
  );
}