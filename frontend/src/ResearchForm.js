import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { Copy, Download, Hammer, Gem, AlertTriangle } from 'lucide-react';
import { Box, Input, Button, Select, FormControl, FormLabel, Text, Heading, Progress, Alert, AlertIcon, AlertDescription, Tabs, TabList, TabPanels, Tab, TabPanel, VStack, HStack, Container, Grid, GridItem, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, useDisclosure, Badge, Card, CardBody } from '@chakra-ui/react';
import { 
  RenderStep1, 
  RenderStep2, 
  RenderStep3, 
  RenderStep4, 
  RenderStep5, 
  RenderStep6, 
  RenderStep7 
} from './JsonRenderers';
import { generatePDFFromJSON } from './PdfGenerator';

const ResearchForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [companyName, setCompanyName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [tavilyApiKey, setTavilyApiKey] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('step1');
  const [similarCompanies, setSimilarCompanies] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Auto-populate company name if passed from navigation state
  useEffect(() => {
    if (location.state?.companyName) {
      setCompanyName(location.state.companyName);
    }
  }, [location.state]);

  const steps = [
    { id: 'step1', name: '⛰️ Strategic Objectives', key: 'step1_strategic_objectives' },
    { id: 'step2', name: '🗺️ Business Unit Alignment', key: 'step2_bu_alignment' },
    { id: 'step3', name: '⛏️ BU Deep-Dive', key: 'step3_bu_deepdive' },
    { id: 'step4', name: '🤖 AI Alignment', key: 'step4_ai_alignment' },
    { id: 'step5', name: '👥 Persona Mapping', key: 'step5_persona_mapping' },
    { id: 'step6', name: '💰 Value Realization', key: 'step6_value_realization' },
    { id: 'step7', name: '✉️ Outreach Email', key: 'step7_outreach_email' }
  ];

  const miningMessages = [
    '⛏️ Breaking ground...',
    '🔍 Surveying the landscape...',
    '⚒️ Digging deeper...',
    '💎 Discovering insights...',
    '🏔️ Scaling new heights...',
    '🗺️ Mapping the territory...',
    '⛰️ Mining strategic objectives...',
    '💡 Unearthing opportunities...',
    '🎯 Striking gold...',
    '✨ Polishing the gems...'
  ];

  const getProgressEmoji = (percent) => {
    if (percent < 20) return '⛏️';
    if (percent < 40) return '🔨';
    if (percent < 60) return '💎';
    if (percent < 80) return '✨';
    return '🏆';
  };

  const checkForSimilarCompanies = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return false;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/companies/fuzzy-match?name=${encodeURIComponent(companyName)}&threshold=0.6`);
      const data = await response.json();
      
      if (data.matches && data.matches.length > 0) {
        setSimilarCompanies(data.matches);
        onOpen(); // Show modal with matches
        return true; // Has matches
      }
      return false; // No matches, proceed
    } catch (err) {
      console.error('Error checking for similar companies:', err);
      return false; // On error, proceed anyway
    }
  };

  const handleStartResearch = async () => {
    // First check for similar companies
    const hasMatches = await checkForSimilarCompanies();
    if (hasMatches) {
      return; // Modal is open, user will decide
    }
    // No matches, proceed directly
    await startResearch();
  };

  const startResearch = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    onClose(); // Close modal if open
    setIsResearching(true);
    setProgress(0);
    setCurrentStep('Starting research...');
    setError(null);
    setResults(null);

    try {
      const response = await fetch('http://localhost:8000/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: companyName,
          llm_provider: provider,
          api_key: apiKey,
          tavily_api_key: tavilyApiKey || null
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress') {
              setProgress(data.progress_percent);
              setCurrentStep(data.message);
            } else if (data.type === 'step_complete') {
              setProgress(data.progress_percent);
              setCurrentStep(`Completed: ${data.step_name}`);
            } else if (data.type === 'complete') {
              setResults(data.results);
              setIsResearching(false);
              setActiveTab('step1');
              
              // Save to database
              if (data.results && data.metadata) {
                try {
                  const saveResponse = await fetch('http://localhost:8000/api/research/save', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      research_id: data.results.research_id,
                      company_name: companyName,
                      industry: data.results.industry,
                      llm_provider: provider,
                      results: data.results,
                      metadata: data.metadata,
                      user_email: null
                    })
                  });
                  
                  if (saveResponse.ok) {
                    const saveData = await saveResponse.json();
                    console.log('Research saved to database:', saveData);
                    // Update results with database IDs
                    setResults({
                      ...data.results,
                      company_id: saveData.company_id,
                      report_id: saveData.report_id
                    });
                  }
                } catch (saveErr) {
                  console.error('Failed to save to database:', saveErr);
                  // Don't show error to user - research still succeeded
                }
              }
            } else if (data.type === 'error') {
              setError(data.message);
              setIsResearching(false);
            }
          }
        }
      }
    } catch (err) {
      setError(`Failed to connect to backend: ${err.message}`);
      setIsResearching(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResults = () => {
    generatePDFFromJSON(results);
  };

  const parseMarkdownTable = (text) => {
    // Handle non-string inputs
    if (!text || typeof text !== 'string') return null;
    
    const lines = text.split('\n');
    const tableLines = [];
    let inTable = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('|')) {
        if (!inTable) inTable = true;
        tableLines.push(line);
      } else if (inTable && line === '') {
        // End of table
        break;
      }
    }
    
    if (tableLines.length < 2) return null;
    
    // Parse header and strip markdown and HTML
    const stripMarkdown = (str) => {
      return str
        .replace(/<[^>]*>/g, '')              // HTML tags
        .replace(/\*\*(.*?)\*\*/g, '$1')      // Bold
        .replace(/\*(.*?)\*/g, '$1')          // Italic
        .replace(/`(.*?)`/g, '$1')            // Code
        .replace(/#{1,6}\s/g, '')             // Headers
        .replace(/&nbsp;/g, ' ')              // HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
    };
    
    const headers = tableLines[0].split('|').map(h => stripMarkdown(h)).filter(h => h);
    
    // Skip separator line (index 1)
    // Parse rows and strip markdown
    const rows = [];
    for (let i = 2; i < tableLines.length; i++) {
      const cells = tableLines[i].split('|').map(c => stripMarkdown(c)).filter(c => c);
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    
    return { headers, rows };
  };

  const renderTable = (tableData) => {
    if (!tableData) return null;
    
    return (
      <Box overflowX="auto" mb={6}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#4b5563', color: 'white' }}>
              {tableData.headers.map((header, idx) => (
                <th key={idx} style={{ 
                  padding: '12px', 
                  textAlign: 'left', 
                  borderBottom: '2px solid #374151',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ 
                backgroundColor: rowIdx % 2 === 0 ? 'white' : '#f3f4f6',
                borderBottom: '1px solid #e5e7eb'
              }}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} style={{ 
                    padding: '10px', 
                    borderBottom: '1px solid #e5e7eb',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    );
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    
    // Handle structured response format - extract string content
    if (typeof text === 'object') {
      text = text.markdown || text.data || JSON.stringify(text);
    }
    
    // Ensure we have a string at this point
    if (typeof text !== 'string') {
      return <Text color="red.500">Invalid content format</Text>;
    }
    
    // First, check if there's a markdown table
    const tableData = parseMarkdownTable(text);
    
    // Split content into sections
    const sections = [];
    let currentPos = 0;
    
    if (tableData) {
      const tableStart = text.indexOf('|');
      const textBefore = text.substring(0, tableStart).trim();
      
      // Find end of table
      const lines = text.split('\n');
      let tableEndLine = 0;
      let foundTable = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('|')) {
          foundTable = true;
          tableEndLine = i;
        } else if (foundTable && lines[i].trim() === '') {
          break;
        }
      }
      
      const textAfter = lines.slice(tableEndLine + 1).join('\n').trim();
      
      return (
        <Box>
          {textBefore && renderTextContent(textBefore)}
          {renderTable(tableData)}
          {textAfter && renderTextContent(textAfter)}
        </Box>
      );
    }
    
    return renderTextContent(text);
  };
  
  const renderTextContent = (text) => {
    // Ensure text is a string
    if (!text || typeof text !== 'string') return null;
    
    const lines = text.split('\n');
    const elements = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Headers
      if (line.startsWith('###')) {
        elements.push(<Heading key={i} size="sm" mt={4} mb={2} color="gray.700">{line.replace(/^###\s*/, '').replace(/\*\*/g, '')}</Heading>);
        i++;
      } else if (line.startsWith('##')) {
        elements.push(<Heading key={i} size="md" mt={4} mb={2} color="gray.700">{line.replace(/^##\s*/, '').replace(/\*\*/g, '')}</Heading>);
        i++;
      } else if (line.startsWith('#')) {
        elements.push(<Heading key={i} size="lg" mt={4} mb={3} color="gray.800">{line.replace(/^#\s*/, '').replace(/\*\*/g, '')}</Heading>);
        i++;
      }
      // Bold text or list items
      else if (line.startsWith('**') || line.startsWith('- ') || line.startsWith('* ') || /^\d+\./.test(line)) {
        // Handle lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const listItems = [];
          while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
            const item = lines[i].replace(/^[-*]\s*/, '');
            listItems.push(<li key={i} style={{ marginBottom: '4px' }}>{formatInlineMarkdown(item)}</li>);
            i++;
          }
          elements.push(<ul key={`list-${i}`} style={{ marginLeft: '20px', marginBottom: '12px' }}>{listItems}</ul>);
        }
        // Numbered lists
        else if (/^\d+\./.test(line)) {
          const listItems = [];
          while (i < lines.length && /^\d+\./.test(lines[i])) {
            const item = lines[i].replace(/^\d+\.\s*/, '');
            listItems.push(<li key={i} style={{ marginBottom: '4px' }}>{formatInlineMarkdown(item)}</li>);
            i++;
          }
          elements.push(<ol key={`list-${i}`} style={{ marginLeft: '20px', marginBottom: '12px' }}>{listItems}</ol>);
        }
        // Bold paragraphs
        else {
          elements.push(<Text key={i} mb={2} fontWeight="bold">{formatInlineMarkdown(line)}</Text>);
          i++;
        }
      }
      // Empty lines
      else if (line.trim() === '') {
        i++;
      }
      // Regular paragraphs
      else {
        elements.push(<Text key={i} mb={2}>{formatInlineMarkdown(line)}</Text>);
        i++;
      }
    }
    
    return <Box>{elements}</Box>;
  };
  
  const formatInlineMarkdown = (text) => {
    // Bold
    let formatted = text.split(/(\*\*.*?\*\*)/).map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    
    return formatted;
  };

  const renderStepContent = (stepKey) => {
    if (!results) return null;
    
    let content = results.steps[stepKey];
    let citations = [];
    
    // Extract data and citations from backend response structure
    if (typeof content === 'object' && content !== null) {
      citations = content.citations || [];
      if (content.data) {
        content = content.data;
      }
    }
    
    // Route to appropriate JSON renderer
    switch(stepKey) {
      case 'step1_strategic_objectives':
        return <RenderStep1 data={content} citations={citations} />;
      case 'step2_bu_alignment':
        return <RenderStep2 data={content} citations={citations} />;
      case 'step3_bu_deepdive':
        return <RenderStep3 data={content} citations={citations} />;
      case 'step4_ai_alignment':
        return <RenderStep4 data={content} citations={citations} />;
      case 'step5_persona_mapping':
        return <RenderStep5 data={content} citations={citations} />;
      case 'step6_value_realization':
        return <RenderStep6 data={content} citations={citations} />;
      case 'step7_outreach_email':
        return <RenderStep7 data={content} citations={citations} />;
      default:
        // Fallback for unexpected format
        return <Text>{JSON.stringify(content, null, 2)}</Text>;
    }
  };

  return (
    <Box 
      minH="100vh" 
      w="100%" 
      bgImage="url('/images/prospector-ls.png')"
      bgPosition="center"
      bgRepeat="no-repeat"
      bgSize="cover"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        bg: 'rgba(255, 255, 255, 0.92)',
        zIndex: 0
      }}
    >
      {/* Animated Banner Header */}
      <Box bg="gray.700" py={3} shadow="md" position="relative" zIndex={2}>
        <Container maxW="7xl">
          <HStack justify="center" spacing={3}>
            <Text fontSize="4xl" className="float-animate">⛏️</Text>
            <Heading size="xl" color="white" fontWeight="black" fontFamily="'Montserrat', sans-serif">
              PROSPECTOR
            </Heading>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="5xl" py={6} position="relative" zIndex={1}>
        <Box bg="white" rounded="md" shadow="md" borderWidth={1} borderColor="gray.200" overflow="hidden">
          <Box p={{ base: 8, md: 12 }}>
            {/* Input Section */}
            <VStack spacing={6} mb={10} align="stretch">
              <FormControl>
                <FormLabel fontSize="lg" fontWeight="bold" color="gray.700">
                  Company Search
                </FormLabel>
                <Input
                  size="lg"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., JPMorgan Chase, Microsoft, Tesla"
                  isDisabled={isResearching}
                  borderColor="gray.300"
                  focusBorderColor="gray.500"
                  _hover={{ borderColor: 'gray.400' }}
                />
              </FormControl>

              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="lg" fontWeight="bold" color="gray.700">
                      🤖 LLM Provider
                    </FormLabel>
                    <Select
                      size="lg"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      isDisabled={isResearching}
                      borderColor="gray.300"
                      focusBorderColor="gray.500"
                    >
                      <option value="anthropic">🎭 Anthropic (Claude)</option>
                      <option value="openai">🌟 OpenAI (GPT-4)</option>
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="lg" fontWeight="bold" color="gray.700">
                      🔑 LLM API Key
                    </FormLabel>
                    <Input
                      size="lg"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Your LLM API key"
                      isDisabled={isResearching}
                      borderColor="gray.300"
                      focusBorderColor="gray.500"
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              <FormControl>
                <FormLabel fontSize="lg" fontWeight="bold" color="gray.700">
                  🔍 Tavily API Key (Optional - for real-time web search)
                </FormLabel>
                <Input
                  size="lg"
                  type="password"
                  value={tavilyApiKey}
                  onChange={(e) => setTavilyApiKey(e.target.value)}
                  placeholder="Your Tavily API key (optional)"
                  isDisabled={isResearching}
                  borderColor="gray.300"
                  focusBorderColor="gray.500"
                />
                <Text fontSize="sm" color="gray.600" mt={2}>
                  Get 1,000 free searches/month at <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" style={{color: '#2563eb', textDecoration: 'underline'}}>tavily.com</a>
                </Text>
              </FormControl>

              <Button
                onClick={handleStartResearch}
                isDisabled={isResearching}
                size="lg"
                w="full"
                py={8}
                fontSize="2xl"
                fontWeight="black"
                bg="gray.700"
                _hover={{ bg: 'gray.800' }}
                _disabled={{ bg: 'gray.400' }}
                color="white"
                borderWidth={4}
                borderColor="gray.800"
                shadow="2xl"
              >
                {isResearching ? (
                  <Text>⛏️ MINING DATA...</Text>
                ) : (
                  <Text>START PROSPECTING</Text>
                )}
              </Button>
            </VStack>

            {/* Mining Progress Animation */}
            {isResearching && (
              <Box mb={8} bg="gray.50" p={6} rounded="md" borderWidth={2} borderColor="gray.300">
              <HStack justify="space-between" mb={3}>
                <HStack spacing={3}>
                  <Text fontSize="3xl" className="animate-pulse">{getProgressEmoji(progress)}</Text>
                  <Text fontSize="lg" fontWeight="semibold" color="gray.700">{currentStep}</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" color="gray.700">{progress}%</Text>
              </HStack>
              <Progress
                value={progress}
                size="lg"
                colorScheme="gray"
                bg="gray.200"
                borderRadius="full"
                borderWidth={2}
                borderColor="gray.300"
              />
              <Text fontSize="sm" color="gray.600" mt={2} textAlign="center" fontStyle="italic">
                {miningMessages[Math.floor(progress / 10) % miningMessages.length]}
              </Text>
              </Box>
            )}

            {/* Error Display */}
            {error && (
              <Alert status="error" mb={8} rounded="lg">
                <AlertIcon />
                <Box>
                  <Text fontWeight="semibold">Error</Text>
                  <AlertDescription fontSize="sm">{error}</AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Results Section */}
            {results && (
              <Box mt={8} borderTopWidth={4} borderColor="gray.300" pt={8}>
                <HStack justify="space-between" mb={6} bg="gray.50" p={6} rounded="xl" borderWidth={2} borderColor="gray.300" flexWrap="wrap">
                  <HStack spacing={3}>
                  <Text fontSize="4xl">📊</Text>
                  <Box>
                    <Heading size="lg" color="gray.700">
                      Research Complete: {results.company_name}
                    </Heading>
                    <Text color="gray.600">Your research is ready for review!</Text>
                  </Box>
                </HStack>
                <Button
                  onClick={downloadResults}
                  leftIcon={<Download size={20} />}
                  bg="gray.700"
                  _hover={{ bg: 'gray.600' }}
                  color="white"
                  size="md"
                  fontWeight="semibold"
                >
                  Download PDF
                </Button>
                </HStack>

                {/* Mining Claim Tabs */}
                <Tabs variant="soft-rounded" colorScheme="gray" index={steps.findIndex(s => s.id === activeTab)} onChange={(index) => setActiveTab(steps[index].id)}>
                <TabList flexWrap="wrap" gap={3} mb={6} borderBottomWidth={2} borderColor="gray.300" pb={4}>
                  {steps.map((step) => (
                    <Tab
                      key={step.id}
                      fontWeight="bold"
                      borderWidth={2}
                      borderColor="gray.300"
                      bg="white"
                      color="gray.700"
                      _selected={{ bg: 'gray.200', color: 'gray.900', borderColor: 'gray.400' }}
                      _hover={{ bg: 'gray.100' }}
                    >
                      {step.name}
                    </Tab>
                  ))}
                </TabList>

                <TabPanels>
                  {steps.map((step) => (
                    <TabPanel key={step.id} p={0}>
                      <Box bg="rgba(243, 244, 246, 0.8)" rounded="xl" p={8} minH="96" borderWidth={2} borderColor="gray.300">
                        <HStack justify="space-between" mb={6}>
                          <Heading size="md" color="gray.700">
                            {step.name}
                          </Heading>
                          <Button
                            onClick={() => {
                              const content = results.steps[step.key];
                              const text = typeof content === 'object' 
                                ? JSON.stringify(content, null, 2) 
                                : content;
                              copyToClipboard(text);
                            }}
                            leftIcon={<Copy size={16} />}
                            size="sm"
                            bg="white"
                            borderWidth={2}
                            borderColor="gray.300"
                            _hover={{ bg: 'gray.50' }}
                            fontWeight="semibold"
                            color="gray.700"
                          >
                            Copy Content
                          </Button>
                        </HStack>
                        <Box bg="white" rounded="xl" p={6} borderWidth={2} borderColor="gray.200" overflowY="auto" maxH="96" shadow="inner">
                          {renderStepContent(step.key)}
                        </Box>
                      </Box>
                    </TabPanel>
                  ))}
                </TabPanels>
                </Tabs>
              </Box>
            )}

            {/* Footer */}
            <Box mt={10} pt={8} borderTopWidth={4} borderColor="gray.300" textAlign="center" bg="gray.50" mx={{ base: -8, md: -12 }} px={{ base: 8, md: 12 }} pb={8}>
              <HStack justify="center" spacing={3} color="gray.700" mb={3} flexWrap="wrap">
              <Text fontSize="base" fontWeight="bold">🔒 Your API keys stay secure - No data stored</Text>
            </HStack>
            <Text fontSize="base" color="gray.600" fontWeight="semibold" mt={2}>⏱️ Estimated research time: 5-10 minutes per company</Text>
            <Text fontSize="sm" color="gray.600" mt={3}>Built with FastAPI, React, Claude & GPT-4</Text>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Similar Companies Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <AlertTriangle size={24} color="#F59E0B" />
              <Text>Similar Companies Found</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="info" variant="left-accent">
                <AlertIcon />
                <AlertDescription>
                  We found {similarCompanies.length} similar {similarCompanies.length === 1 ? 'company' : 'companies'} in the database. 
                  Would you like to use existing research or start fresh?
                </AlertDescription>
              </Alert>

              {similarCompanies.map((company) => (
                <Card key={company.id} borderWidth={2} borderColor="gray.200">
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold" fontSize="lg">{company.name}</Text>
                        <Badge colorScheme="green" fontSize="sm">
                          {company.similarity}% match
                        </Badge>
                      </HStack>
                      <HStack spacing={4} fontSize="sm" color="gray.600">
                        <Text>📊 {company.report_count} {company.report_count === 1 ? 'report' : 'reports'}</Text>
                        {company.latest_research && (
                          <Text>📅 {company.days_old} {company.days_old === 1 ? 'day' : 'days'} ago</Text>
                        )}
                      </HStack>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => {
                          navigate(`/company/${company.id}`);
                        }}
                      >
                        View Existing Research
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={startResearch}
              >
                Continue with New Research
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ResearchForm;
