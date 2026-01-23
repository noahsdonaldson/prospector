import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Select, Text, Badge, Button, HStack, VStack, Spinner, Alert,
  AlertIcon, AlertDescription
} from '@chakra-ui/react';
import { Building2, Users, Calendar, Filter } from 'lucide-react';

const CompanyList = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [industryFilter, setIndustryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (industryFilter === 'all') {
      setFilteredCompanies(companies);
    } else {
      setFilteredCompanies(companies.filter(c => c.industry === industryFilter));
    }
  }, [industryFilter, companies]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/companies');
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCompanies(data);
      setFilteredCompanies(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getIndustries = () => {
    const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
    return industries.sort();
  };

  const getStalenessStatus = (lastResearched) => {
    if (!lastResearched) return { color: 'gray', label: 'Never', emoji: '⚫' };
    
    const now = new Date();
    const researchDate = new Date(lastResearched);
    const daysDiff = Math.floor((now - researchDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 7) return { color: 'green', label: 'Fresh', emoji: '🟢' };
    if (daysDiff <= 30) return { color: 'yellow', label: 'Aging', emoji: '🟡' };
    return { color: 'red', label: 'Stale', emoji: '🔴' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Yesterday';
    if (daysDiff < 7) return `${daysDiff} days ago`;
    if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`;
    return `${Math.floor(daysDiff / 30)} months ago`;
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="gray.600" />
          <Text color="gray.600">Loading companies...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={10}>
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      minH="100vh"
      bgImage="url('/images/prospector-ls.png')"
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: 'rgba(255, 255, 255, 0.92)',
        zIndex: 0
      }}
    >
      <Container maxW="container.xl" py={10} position="relative" zIndex={1}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <HStack>
                <Building2 size={32} color="#4b5563" />
                <Heading size="xl" color="gray.700" fontFamily="'Montserrat', sans-serif">
                  Company Research Database
                </Heading>
              </HStack>
              <Text color="gray.600" fontSize="md">
                {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'} researched
              </Text>
            </VStack>
            
            <Button
              colorScheme="gray"
              bg="gray.700"
              color="white"
              size="lg"
              onClick={() => navigate('/')}
              _hover={{ bg: 'gray.600' }}
            >
              + New Research
            </Button>
          </HStack>

          {/* Filter */}
          {getIndustries().length > 0 && (
            <HStack spacing={3} bg="white" p={4} borderRadius="md" boxShadow="sm">
              <Filter size={20} color="#4b5563" />
              <Text fontWeight="600" color="gray.700">Filter by Industry:</Text>
              <Select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                maxW="300px"
                bg="white"
                borderColor="gray.300"
              >
                <option value="all">All Industries ({companies.length})</option>
                {getIndustries().map(industry => (
                  <option key={industry} value={industry}>
                    {industry} ({companies.filter(c => c.industry === industry).length})
                  </option>
                ))}
              </Select>
            </HStack>
          )}

          {/* Companies Table */}
          {filteredCompanies.length === 0 ? (
            <Box bg="white" p={10} borderRadius="md" boxShadow="sm" textAlign="center">
              <Text color="gray.600" fontSize="lg">
                No companies found. Start by researching a company!
              </Text>
              <Button
                mt={4}
                colorScheme="gray"
                bg="gray.700"
                onClick={() => navigate('/')}
              >
                Research First Company
              </Button>
            </Box>
          ) : (
            <Box bg="white" borderRadius="md" boxShadow="md" overflow="hidden">
              <Table variant="simple">
                <Thead bg="gray.700">
                  <Tr>
                    <Th color="white">Company Name</Th>
                    <Th color="white">Industry</Th>
                    <Th color="white">Last Researched</Th>
                    <Th color="white">Status</Th>
                    <Th color="white">Personas</Th>
                    <Th color="white">Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredCompanies.map((company, idx) => {
                    const status = getStalenessStatus(company.last_researched);
                    return (
                      <Tr
                        key={company.id}
                        bg={idx % 2 === 0 ? 'white' : 'gray.50'}
                        _hover={{ bg: 'blue.50', cursor: 'pointer' }}
                        onClick={() => navigate(`/company/${company.id}`)}
                      >
                        <Td fontWeight="600" color="gray.800">
                          {company.name}
                        </Td>
                        <Td>
                          {company.industry ? (
                            <Badge colorScheme="blue" fontSize="sm">
                              {company.industry}
                            </Badge>
                          ) : (
                            <Text color="gray.400" fontSize="sm">Not classified</Text>
                          )}
                        </Td>
                        <Td color="gray.600">
                          <HStack spacing={2}>
                            <Calendar size={16} />
                            <Text>{formatDate(company.last_researched)}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={status.color} fontSize="sm">
                            {status.emoji} {status.label}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Users size={16} color="#4b5563" />
                            <Text color="gray.700" fontWeight="500">
                              {company.persona_count}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            colorScheme="gray"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/company/${company.id}`);
                            }}
                          >
                            View Details
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default CompanyList;
