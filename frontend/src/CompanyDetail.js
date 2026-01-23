import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Container, Heading, Text, VStack, HStack, Button, Table, Thead,
  Tbody, Tr, Th, Td, Badge, Spinner, Alert, AlertIcon, AlertDescription,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
  ModalCloseButton, Input, FormControl, FormLabel, useDisclosure, Tabs,
  TabList, TabPanels, Tab, TabPanel, Divider, useToast, Progress
} from '@chakra-ui/react';
import { ArrowLeft, Calendar, Users, UserPlus, Download, RefreshCw, Eye, Trash2, Shield } from 'lucide-react';
import { generatePDFFromJSON } from './PdfGenerator';
import ValidationReport from './ValidationReport';
import { 
  RenderStep1, 
  RenderStep2, 
  RenderStep3, 
  RenderStep4, 
  RenderStep5, 
  RenderStep6, 
  RenderStep7 
} from './JsonRenderers';

const CompanyDetail = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isValidateOpen, onOpen: onValidateOpen, onClose: onValidateClose } = useDisclosure();
  const toast = useToast();
  
  const [company, setCompany] = useState(null);
  const [reports, setReports] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [validationReport, setValidationReport] = useState(null);
  const [validatingReportId, setValidatingReportId] = useState(null);
  const [judgeApiKey, setJudgeApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationStep, setValidationStep] = useState('');
  
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
        toast({
          title: 'Persona added',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
    } catch (err) {
      console.error('Failed to add persona:', err);
      toast({
        title: 'Error adding persona',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setAddingPersona(false);
    }
  };

  const handleViewReport = async (reportId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/reports/${reportId}`);
      const reportDetails = await response.json();
      setViewingReport(reportDetails);
      onViewOpen();
    } catch (err) {
      toast({
        title: 'Error loading report',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/reports/${reportId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Report deleted',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
        fetchCompanyData(); // Refresh data
      } else {
        throw new Error('Failed to delete report');
      }
    } catch (err) {
      toast({
        title: 'Error deleting report',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleValidateReport = async (reportId) => {
    setValidatingReportId(reportId);
    onValidateOpen();
  };

  const runValidation = async () => {
    if (!judgeApiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key for validation",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setValidating(true);
    setValidationProgress(0);
    setValidationStep('🔍 Starting validation...');
    
    const stepIcons = {
      'step1_overview': '🏢',
      'step2_business_priorities': '🎯',
      'step3_tech_stack': '💻',
      'step4_ai_alignment': '🤖',
      'step5_persona_mapping': '👥',
      'step6_value_realization': '💰',
      'step7_outreach': '📧'
    };
    
    const stepNames = {
      'step1_overview': 'Company Overview',
      'step2_business_priorities': 'Business Priorities',
      'step3_tech_stack': 'Technology Stack',
      'step4_ai_alignment': 'AI Alignment',
      'step5_persona_mapping': 'Persona Mapping',
      'step6_value_realization': 'Business Case & ROI',
      'step7_outreach': 'Outreach Strategy'
    };
    
    try {
      const response = await fetch(`http://localhost:8000/api/reports/${validatingReportId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judge_api_key: judgeApiKey })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Validation failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let stepCount = 0;
      const totalSteps = 8; // 7 steps + 1 overall

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'step_start') {
              stepCount++;
              const icon = stepIcons[data.step_key] || '📊';
              const name = stepNames[data.step_key] || data.step_key;
              setValidationStep(`${icon} Validating ${name}...`);
              setValidationProgress(Math.round((stepCount / totalSteps) * 100));
            } else if (data.type === 'step_complete') {
              const icon = stepIcons[data.step_key] || '📊';
              const name = stepNames[data.step_key] || data.step_key;
              const status = data.status === 'GREEN' ? '✅' : data.status === 'YELLOW' ? '⚠️' : '❌';
              setValidationStep(`${status} ${icon} ${name}: ${data.score}/100`);
            } else if (data.type === 'overall_start') {
              setValidationStep('🔬 Computing overall assessment...');
              setValidationProgress(95);
            } else if (data.type === 'complete') {
              setValidationReport(data.validation_report);
              setValidationProgress(100);
              setValidationStep('✅ Validation complete!');
              
              toast({
                title: "Validation Complete",
                description: `Overall Score: ${data.validation_report.overall_score}/100 (${data.validation_report.overall_status})`,
                status: data.validation_report.overall_status === 'GREEN' ? 'success' : data.validation_report.overall_status === 'YELLOW' ? 'warning' : 'error',
                duration: 5000,
                isClosable: true,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setValidationStep('');
      setValidationProgress(0);
    } finally {
      setValidating(false);
    }
  };

  const downloadPDF = async (reportId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/reports/${reportId}`);
      const reportDetails = await response.json();
      // Ensure company name is available in the report data
      reportDetails.company_name = reportDetails.company_name || company?.name || 'Company';
      generatePDFFromJSON(reportDetails);
    } catch (err) {
      toast({
        title: 'Error generating PDF',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
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
                              colorScheme="purple"
                              leftIcon={<Shield size={16} />}
                              onClick={() => handleValidateReport(report.id)}
                            >
                              Validate
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              leftIcon={<Eye size={16} />}
                              onClick={() => handleViewReport(report.id)}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              leftIcon={<Download size={16} />}
                              onClick={() => downloadPDF(report.id)}
                            >
                              Download
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              leftIcon={<Trash2 size={16} />}
                              onClick={() => handleDeleteReport(report.id)}
                            >
                              Delete
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

      {/* View Report Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            {viewingReport && `${viewingReport.company.name} - Research Report`}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto" pb={6}>
            {viewingReport && (
              <Tabs colorScheme="gray">
                <TabList>
                  <Tab>⛰️ Strategic Objectives</Tab>
                  <Tab>🗺️ BU Alignment</Tab>
                  <Tab>⛏️ BU Deep-Dive</Tab>
                  <Tab>🤖 AI Alignment</Tab>
                  <Tab>👥 Persona Mapping</Tab>
                  <Tab>💰 Value Realization</Tab>
                  <Tab>✉️ Outreach Email</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    {viewingReport.steps.step1_strategic_objectives?.data && (
                      <RenderStep1 
                        data={viewingReport.steps.step1_strategic_objectives.data} 
                        citations={viewingReport.steps.step1_strategic_objectives.citations || []}
                      />
                    )}
                  </TabPanel>
                  <TabPanel>
                    {viewingReport.steps.step2_bu_alignment?.data && (
                      <RenderStep2 
                        data={viewingReport.steps.step2_bu_alignment.data}
                        citations={viewingReport.steps.step2_bu_alignment.citations || []}
                      />
                    )}
                  </TabPanel>
                  <TabPanel>
                    {viewingReport.steps.step3_bu_deepdive?.data && (
                      <RenderStep3 
                        data={viewingReport.steps.step3_bu_deepdive.data}
                        citations={viewingReport.steps.step3_bu_deepdive.citations || []}
                      />
                    )}
                  </TabPanel>
                  <TabPanel>
                    {viewingReport.steps.step4_ai_alignment?.data && (
                      <RenderStep4 
                        data={viewingReport.steps.step4_ai_alignment.data}
                        citations={viewingReport.steps.step4_ai_alignment.citations || []}
                      />
                    )}
                  </TabPanel>
                  <TabPanel>
                    {viewingReport.steps.step5_persona_mapping?.data && (
                      <RenderStep5 
                        data={viewingReport.steps.step5_persona_mapping.data}
                        citations={viewingReport.steps.step5_persona_mapping.citations || []}
                      />
                    )}
                  </TabPanel>
                  <TabPanel>
                    {viewingReport.steps.step6_value_realization?.data && (
                      <RenderStep6 
                        data={viewingReport.steps.step6_value_realization.data}
                        citations={viewingReport.steps.step6_value_realization.citations || []}
                      />
                    )}
                  </TabPanel>
                  <TabPanel>
                    {viewingReport.steps.step7_outreach_email?.data && (
                      <RenderStep7 
                        data={viewingReport.steps.step7_outreach_email.data}
                        citations={viewingReport.steps.step7_outreach_email.citations || []}
                      />
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              leftIcon={<Download size={16} />}
              onClick={() => {
                const reportWithCompany = { ...viewingReport, company_name: viewingReport.company_name || company?.name || 'Company' };
                generatePDFFromJSON(reportWithCompany);
              }}
            >
              Download PDF
            </Button>
            <Button variant="ghost" onClick={onViewClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Validation Modal */}
      <Modal isOpen={isValidateOpen} onClose={onValidateClose} size="6xl" closeOnOverlayClick={!validating}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Shield size={24} color="#9333ea" />
              <Text>Research Quality Validation</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton isDisabled={validating} />
          <ModalBody>
            {validating ? (
              <VStack spacing={4} align="stretch" py={6}>
                <Box textAlign="center">
                  <Heading size="md" mb={2}>{validationStep}</Heading>
                  <Progress 
                    value={validationProgress} 
                    size="lg" 
                    colorScheme="purple" 
                    borderRadius="full"
                    hasStripe
                    isAnimated
                  />
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    {validationProgress}% Complete
                  </Text>
                </Box>
                <Alert status="info" variant="left-accent">
                  <AlertIcon />
                  <Box>
                    <Text fontSize="sm">
                      Using GPT-4o to independently validate research quality, citations, and consistency.
                      This takes about 1-2 minutes.
                    </Text>
                  </Box>
                </Alert>
              </VStack>
            ) : !validationReport ? (
              <VStack spacing={4} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="600">Judge LLM Validation</Text>
                    <Text fontSize="sm">
                      This uses OpenAI GPT-4o to independently validate your research for accuracy,
                      citation quality, and consistency.
                    </Text>
                  </Box>
                </Alert>
                
                <FormControl isRequired>
                  <FormLabel>OpenAI API Key</FormLabel>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={judgeApiKey}
                    onChange={(e) => setJudgeApiKey(e.target.value)}
                  />
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Your API key is only used for this validation and is not stored.
                  </Text>
                </FormControl>

                <Button
                  colorScheme="purple"
                  onClick={runValidation}
                  isDisabled={!judgeApiKey}
                  size="lg"
                >
                  Run Validation
                </Button>
              </VStack>
            ) : (
              <ValidationReport validation={validationReport} />
            )}
          </ModalBody>
          <ModalFooter>
            {validationReport && !validating && (
              <Button
                colorScheme="purple"
                variant="outline"
                mr={3}
                onClick={() => {
                  setValidationReport(null);
                  setJudgeApiKey('');
                  setValidationProgress(0);
                  setValidationStep('');
                }}
              >
                Run Again
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => {
                if (!validating) {
                  onValidateClose();
                  setValidationReport(null);
                  setJudgeApiKey('');
                  setValidationProgress(0);
                  setValidationStep('');
                }
              }}
              isDisabled={validating}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CompanyDetail;
