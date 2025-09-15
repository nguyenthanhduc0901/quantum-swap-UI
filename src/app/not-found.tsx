import { Box, Button, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import NextLink from "next/link";

export default function NotFound() {
  return (
    <Flex minH="60vh" align="center" justify="center">
      <VStack p={8} rounded="2xl" border="1px solid" borderColor="rgba(255,255,255,0.08)" bg="rgba(23,35,53,0.8)" gap={3}>
        <Heading size="lg" color="white">404 - Page Not Found</Heading>
        <Text color="whiteAlpha.700">The page you are looking for does not exist.</Text>
        <Button as={NextLink} href="/" bg="whiteAlpha.200" _hover={{ bg: "whiteAlpha.300" }} color="white">Go Home</Button>
      </VStack>
    </Flex>
  );
}


