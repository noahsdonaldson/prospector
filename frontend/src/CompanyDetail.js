import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Heading, Text, VStack, HStack, Button, Table, Thead,
  Tbody, Tr, Th, Td, Badge, Spinner, Alert, AlertIcon, AlertDescription,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
  ModalCloseButton, Input, FormControl, FormLabel, useDisclosure, Tabs,
  TabList, TabPanels, Tab, TabPanel, Divider
} from '@chakra-ui/react';
import { ArrowLeft, Calendar, Users, UserPlus, Download, RefreshCw } from 'lucide-react';
import { jsPDF } from 'jspdf';

const CompanyDetail = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [company, setCompany] = useState(null);
  const [reports, setReports] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add persona form
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaTitle, setNewPersonaTitle] = useState('');
  const [addingPersona, setAddingPersona] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      // Fetch company list to get company info
      const companiesRes = await fetch('http://localhost:8000/api/companies');
      const companies = await companiesRes.json();
      const companyData = companies.find(c => c.id === parseInt(companyId));
      
      if (!companyData) throw new Error('Company not found');
      setCompany(companyData);

      // Fetch reports
      const reportsRes = await fetch(`http://localhost:8000/api/companies/${companyId}/reports`);
      const reportsData = await reportsRes.json();
      setReports(reportsData);

      // Fetch personas
      const personasRes = await fetch(`http://localhost:8000/api/companies/${companyId}/personas`);
      const personasData = await personasRes.json();
      setPersonas(personasData);

      // Load most recent report details
      if (reportsData.length > 0) {
        const latestReportRes = await fetch(`http://localhost:8000/api/reports/${reportsData[0].id}`);
        const reportDetails = await latestReportRes.json();
        setSelectedReport(reportDetails);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAddPersona = async () => {
    if (!newPersonaName.trim() || !newPersonaTitle.trim()) return;

    setAddingPersona(true);
    try {
      const response = await fetch('http://localhost:8000/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: parseInt(companyId),
          name: newPersonaName,
          title: newPersonaTitle,
          added_by: 'user'
        })
      });

      if (response.ok) {
        setNewPersonaName('');
        setNewPersonaTitle('');
        onClose();
        fetchCompanyData(); // Refresh data
      }
    } catch (err) {
      console.error('Failed to add persona:', err);
    } finally {
      setAddingPersona(false);
    }
  };

  const downloadPDF = (report) => {
    const doc = new jsPDF();
    const margin = 15;
    let yPosition = 20;

    // Helper to strip markdown
    const stripMarkdown = (text) => {
      if (!text) return '';
      return text
        .replace(/<[^>]*>/g, '')
        .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/~~(.*?)~~/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim();
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`${report.company.name} - Account Research`, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date(report.metadata.created_at).toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    // Steps
    const steps = [
      { name: 'Strategic Objectives', key: 'step1_strategic_objectives' },
      { name: 'Business Unit Alignment', key: 'step2_bu_alignment' },
      { name: 'Business Unit Deep-Dive', key: 'step3_bu_deepdive' },
      { name: 'AI Alignment', key: 'step4_ai_alignment' },
      { name: 'Persona Mapping', key: 'step5_persona_mapping' },
      { name: 'Value Realization', key: 'step6_value_realization' },
      { name: 'Outreach Email', key: 'step7_outreach_email' }
    ];

    steps.forEach(step => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      const stepData = report.steps[step.key];
      if (!stepData) return;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(step.name, margin, yPosition);
      yPosition += 8;

      const content = stepData.markdown || stepData.data || '';
      const lines = stripMarkdown(content).split('\n').slice(0, 20); // Limit lines

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      lines.forEach(line => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        const wrappedLines = doc.splitTextToSize(line, 180);
        wrappedLines.forEach(wrapped => {
          doc.text(wrapped, margin, yPosition);
          yPosition += 5;
        });
      });

      yPosition += 5;
    });

    doc.save(`${report.company.name}_Report_${report.id}.pdf`);
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

  if (loading) {
    return (
      <Container maxW="container.xl" py={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="gray.600" />
          <Text color="gray.600">Loading company data...</Text>
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
        <Button mt={4} onClick={() => navigate('/companies')}>
          Back to Companies
        </Button>
      </Container>
    );
  }

  const status = getStalenessStatus(company.last_researched);

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
          <HStack justify="space-between">
            <HStack spacing={4}>
              <Button
                variant="ghost"
                onClick={() => navigate('/companies')}
                leftIcon={<ArrowLeft size={20} />}
              >
                Back to Companies
              </Button>
              <Divider orientation="vertical" h="30px" />
              <VStack align="start" spacing={0}>
                <Heading size="lg" color="gray.700" fontFamily="'Montserrat', sans-serif">
                  {company.name}
                </Heading>
                <HStack spacing={3}>
                  {company.industry && (
                    <Badge colorScheme="blue" fontSize="sm">{company.industry}</Badge>
                  )}
                  <Badge colorScheme={status.color} fontSize="sm">
                    {status.emoji} {status.label}
                  </Badge>
                  <Text color="gray.600" fontSize="sm">
                    Last researched: {new Date(company.last_researched).toLocaleDateString()}
                  </Text>
                </HStack>
              </VStack>
            </HStack>
            <HStack>
              <Button
                colorScheme="blue"
                variant="outline"
                leftIcon={<RefreshCw size={18} />}
                onClick={() => navigate('/', { state: { companyName: company.name } })}
              >
                Re-run Research
              </Button>
            </HStack>
          </HStack>

          {/* Tabs */}
          <Tabs colorScheme="gray">
            <TabList>
              <Tab>Reports ({reports.length})</Tab>
              <Tab>Personas ({personas.length})</Tab>
            </TabList>

            <TabPanels>
              {/* Reports Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {reports.length === 0 ? (
                    <Box bg="white" p={8} borderRadius="md" textAlign="center">
                      <Text color="gray.600">No reports yet</Text>
                    </Box>
                  ) : (
                    reports.map(report => (
                      <Box
                        key={report.id}
                        bg="white"
                        p={5}
                        borderRadius="md"
                        boxShadow="sm"
                        borderLeft="4px solid"
                        borderLeftColor={report.status === 'complete' ? 'green.400' : 'red.400'}
                      >
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Calendar size={16} color="#4b5563" />
                              <Text fontWeight="600" color="gray.700">
                                {new Date(report.created_at).toLocaleString()}
                              </Text>
                              <Badge colorScheme={report.status === 'complete' ? 'green' : 'red'}>
                                {report.status}
                              </Badge>
                            </HStack>
                            <HStack spacing={4} fontSize="sm" color="gray.600">
                              <Text>Model: {report.llm_model || report.llm_provider}</Text>
                              {report.research_duration_seconds && (
                                <Text>Duration: {Math.floor(report.research_duration_seconds / 60)}m</Text>
                              )}
                              {report.total_tokens && (
                                <Text>Tokens: {report.total_tokens.toLocaleString()}</Text>
                              )}
                              {report.tavily_searches && (
                                <Text>Searches: {report.tavily_searches}</Text>
                              )}
                            </HStack>
                          </VStack>
                          <HStack>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              leftIcon={<Download size={16} />}
                              onClick={() => {
                                fetch(`http://localhost:8000/api/reports/${report.id}`)
                                  .then(res => res.json())
                                  .then(reportDetails => downloadPDF(reportDetails));
                              }}
                            >
                              Download PDF
                            </Button>
                          </HStack>
                        </HStack>
                      </Box>
                    ))
                  )}
                </VStack>
              </TabPanel>

              {/* Personas Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="lg" fontWeight="600" color="gray.700">
                      Decision Makers
                    </Text>
                    <Button
                      colorScheme="green"
                      size="sm"
                      leftIcon={<UserPlus size={16} />}
                      onClick={onOpen}
                    >
                      Add Person
                    </Button>
                  </HStack>

                  {personas.length === 0 ? (
                    <Box bg="white" p={8} borderRadius="md" textAlign="center">
                      <Text color="gray.600">No personas found</Text>
                      <Text fontSize="sm" color="gray.500" mt={2}>
                        Run research or add personas manually
                      </Text>
                    </Box>
                  ) : (
                    <Box bg="white" borderRadius="md" boxShadow="sm" overflow="hidden">
                      <Table variant="simple">
                        <Thead bg="gray.700">
                          <Tr>
                            <Th color="white">Name</Th>
                            <Th color="white">Title</Th>
                            <Th color="white">Source</Th>
                            <Th color="white">Last Researched</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {personas.map((persona, idx) => (
                            <Tr key={persona.id} bg={idx % 2 === 0 ? 'white' : 'gray.50'}>
                              <Td fontWeight="600" color="gray.800">
                                {persona.name || <Text color="gray.400">No name</Text>}
                              </Td>
                              <Td color="gray.700">{persona.title || '-'}</Td>
                              <Td>
                                <Badge colorScheme={persona.source === 'auto' ? 'blue' : 'green'}>
                                  {persona.source === 'auto' ? '🤖 Auto' : '👤 Manual'}
                                </Badge>
                              </Td>
                              <Td color="gray.600" fontSize="sm">
                                {persona.last_researched_at 
                                  ? new Date(persona.last_researched_at).toLocaleDateString()
                                  : 'Not researched'}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>

      {/* Add Persona Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Person to Research</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="e.g., Jane Smith"
                  value={newPersonaName}
                  onChange={(e) => setNewPersonaName(e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  placeholder="e.g., VP of Operations"
                  value={newPersonaTitle}
                  onChange={(e) => setNewPersonaTitle(e.target.value)}
                />
              </FormControl>
              <Text fontSize="sm" color="gray.600">
                This person will be added to the research queue for future analysis.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleAddPersona}
              isLoading={addingPersona}
              isDisabled={!newPersonaName.trim() || !newPersonaTitle.trim()}
            >
              Add Person
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CompanyDetail;
