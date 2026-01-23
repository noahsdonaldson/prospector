import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ChakraProvider, Box, HStack, Button, Container } from '@chakra-ui/react';
import { Home, Building2, Search } from 'lucide-react';
import ResearchForm from './ResearchForm';
import CompanyList from './CompanyList';
import CompanyDetail from './CompanyDetail';

const Navigation = () => {
  const location = useLocation();
  
  return (
    <Box bg="gray.700" py={3} boxShadow="md">
      <Container maxW="container.xl">
        <HStack spacing={4}>
          <Link to="/">
            <Button
              leftIcon={<Search size={18} />}
              variant={location.pathname === '/' ? 'solid' : 'ghost'}
              colorScheme="whiteAlpha"
              color="white"
            >
              New Research
            </Button>
          </Link>
          <Link to="/companies">
            <Button
              leftIcon={<Building2 size={18} />}
              variant={location.pathname.startsWith('/compan') ? 'solid' : 'ghost'}
              colorScheme="whiteAlpha"
              color="white"
            >
              Companies
            </Button>
          </Link>
        </HStack>
      </Container>
    </Box>
  );
};

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Box minH="100vh">
          <Navigation />
          <Routes>
            <Route path="/" element={<ResearchForm />} />
            <Route path="/companies" element={<CompanyList />} />
            <Route path="/company/:companyId" element={<CompanyDetail />} />
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  );
}

export default App;
