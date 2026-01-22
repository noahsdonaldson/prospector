import React, { useState } from 'react';
import { Copy, Download, Hammer, Gem } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Box, Input, Button, Select, FormControl, FormLabel, Text, Heading, Progress, Alert, AlertIcon, AlertDescription, Tabs, TabList, TabPanels, Tab, TabPanel, VStack, HStack, Container, Grid, GridItem } from '@chakra-ui/react';

const ResearchApp = () => {
  const [companyName, setCompanyName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('anthropic');
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('step1');

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

  const startResearch = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

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
          api_key: apiKey
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
    if (!results) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (2 * margin);
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`Prospector Research: ${results.company_name}`, margin, yPosition);
    yPosition += 15;
    
    // Process each step
    const stepOrder = [
      { key: 'step1_master_research', name: 'Strategic Objectives & Initiatives' },
      { key: 'step2_bu_alignment', name: 'Business-Unit Strategic Alignment' },
      { key: 'step3_bu_deepdive', name: 'Business Unit Deep-Dive' },
      { key: 'step4_ai_alignment', name: 'AI Alignment & Use Cases' },
      { key: 'step5_persona_mapping', name: 'Persona Mapping & Outreach' },
      { key: 'step6_value_realization', name: 'Value Realization & Strategic Alignment' },
      { key: 'step7_outreach_email', name: 'Personalized Outreach Email' }
    ];
    
    stepOrder.forEach((step, index) => {
      const content = results.steps[step.key];
      if (!content) return;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Step header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${step.name}`, margin, yPosition);
      yPosition += 8;
      
      // Content
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      let textContent = '';
      if (step.key === 'step3_bu_deepdive' && typeof content === 'object') {
        Object.entries(content).forEach(([bu, buContent]) => {
          textContent += `\n${bu}:\n${buContent}\n`;
        });
      } else {
        textContent = content;
      }
      
      // Split text into lines and add to PDF
      const lines = doc.splitTextToSize(textContent, maxWidth);
      lines.forEach(line => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      
      yPosition += 5; // Extra space between sections
    });
    
    doc.save(`${results.company_name}_research.pdf`);
  };

  // Parse markdown tables and render them as HTML tables
  const parseMarkdownTable = (text) => {
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
    
    // Parse header
    const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h);
    
    // Skip separator line (index 1)
    // Parse rows
    const rows = [];
    for (let i = 2; i < tableLines.length; i++) {
      const cells = tableLines[i].split('|').map(c => c.trim()).filter(c => c);
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
    const lines = text.split('\n');
    const elements = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Headers
      if (line.startsWith('###')) {
        elements.push(<Heading key={i} size="sm" mt={4} mb={2} color="amber.800">{line.replace(/^###\s*/, '').replace(/\*\*/g, '')}</Heading>);
        i++;
      } else if (line.startsWith('##')) {
        elements.push(<Heading key={i} size="md" mt={4} mb={2} color="amber.800">{line.replace(/^##\s*/, '').replace(/\*\*/g, '')}</Heading>);
        i++;
      } else if (line.startsWith('#')) {
        elements.push(<Heading key={i} size="lg" mt={4} mb={3} color="amber.900">{line.replace(/^#\s*/, '').replace(/\*\*/g, '')}</Heading>);
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
    
    const content = results.steps[stepKey];
    
    if (stepKey === 'step3_bu_deepdive' && typeof content === 'object') {
      return (
        <VStack spacing={6} align="stretch">
          {Object.entries(content).map(([bu, buContent]) => (
            <Box key={bu} bg="rgba(255, 255, 255, 0.7)" p={4} rounded="lg" borderWidth={1} borderColor="blue.200">
              <Heading size="md" mb={4} color="blue.700">{bu}</Heading>
              {renderMarkdown(buContent)}
            </Box>
          ))}
        </VStack>
      );
    }
    
    return renderMarkdown(content);
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
        bg: 'rgba(254, 252, 232, 0.92)',
        zIndex: 0
      }}
    >
      {/* Animated Banner Header */}
      <Box className="gradient-animate" bgGradient="linear(to-r, amber.600, orange.500, yellow.500)" py={8} shadow="2xl" position="relative" zIndex={2}>
        <Container maxW="7xl">
          <HStack justify="center" spacing={6}>
            <Text fontSize="8xl" className="float-animate">⛏️</Text>
            <Heading size="4xl" color="black" fontWeight="black" textShadow="lg" fontFamily="'Montserrat', sans-serif">
              PROSPECTOR
            </Heading>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="5xl" py={12} position="relative" zIndex={1}>
        <Box bg="white" rounded="3xl" shadow="2xl" borderWidth={4} borderColor="amber.400" overflow="hidden" opacity={0.95}>
          <Box p={{ base: 8, md: 12 }}>
            {/* Input Section */}
            <VStack spacing={6} mb={10} align="stretch">
              <FormControl>
                <FormLabel fontSize="lg" fontWeight="bold" color="amber.900">
                  Company Search
                </FormLabel>
                <Input
                  size="lg"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., JPMorgan Chase, Microsoft, Tesla"
                  isDisabled={isResearching}
                  borderColor="amber.300"
                  focusBorderColor="amber.500"
                  _hover={{ borderColor: 'amber.400' }}
                />
              </FormControl>

              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="lg" fontWeight="bold" color="blue.900">
                      🤖 LLM Provider
                    </FormLabel>
                    <Select
                      size="lg"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      isDisabled={isResearching}
                      borderColor="blue.300"
                      focusBorderColor="blue.500"
                    >
                      <option value="anthropic">🎭 Anthropic (Claude)</option>
                      <option value="openai">🌟 OpenAI (GPT-4)</option>
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel fontSize="lg" fontWeight="bold" color="purple.900">
                      🔑 API Key
                    </FormLabel>
                    <Input
                      size="lg"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Your API key"
                      isDisabled={isResearching}
                      borderColor="purple.300"
                      focusBorderColor="purple.500"
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              <Button
                onClick={startResearch}
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
              <Box mb={8} bgGradient="linear(to-r, amber.50, orange.50)" p={6} rounded="xl" borderWidth={2} borderColor="amber.300">
              <HStack justify="space-between" mb={3}>
                <HStack spacing={3}>
                  <Text fontSize="3xl" className="animate-pulse">{getProgressEmoji(progress)}</Text>
                  <Text fontSize="lg" fontWeight="semibold" color="amber.800">{currentStep}</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold" color="amber.600">{progress}%</Text>
              </HStack>
              <Progress
                value={progress}
                size="lg"
                colorScheme="orange"
                bg="amber.100"
                borderRadius="full"
                borderWidth={2}
                borderColor="amber.300"
              />
              <Text fontSize="sm" color="amber.700" mt={2} textAlign="center" fontStyle="italic">
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

            {/* Mining Results Section */}
            {results && (
              <Box mt={8} borderTopWidth={4} borderColor="amber.300" pt={8}>
                <HStack justify="space-between" mb={6} bgGradient="linear(to-r, amber.100, orange.100)" p={6} rounded="xl" borderWidth={2} borderColor="amber.300" flexWrap="wrap">
                  <HStack spacing={3}>
                  <Text fontSize="4xl">💎</Text>
                  <Box>
                    <Heading size="lg" color="amber.800">
                      Strike Gold: {results.company_name}
                    </Heading>
                    <Text color="amber.600">Your prospecting mission is complete!</Text>
                  </Box>
                </HStack>
                <Button
                  onClick={downloadResults}
                  leftIcon={<Download size={20} />}
                  bgGradient="linear(to-r, green.600, green.700)"
                  _hover={{ bgGradient: 'linear(to-r, green.700, green.800)' }}
                  color="white"
                  size="md"
                  fontWeight="semibold"
                >
                  Download Gems
                </Button>
                </HStack>

                {/* Mining Claim Tabs */}
                <Tabs variant="soft-rounded" colorScheme="orange" index={steps.findIndex(s => s.id === activeTab)} onChange={(index) => setActiveTab(steps[index].id)}>
                <TabList flexWrap="wrap" gap={3} mb={6} borderBottomWidth={4} borderColor="amber.200" pb={4}>
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
                          <Heading size="md" color="amber.800">
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
                            borderColor="amber.300"
                            _hover={{ bg: 'amber.50' }}
                            fontWeight="semibold"
                            color="amber.700"
                          >
                            Copy Insight
                          </Button>
                        </HStack>
                        <Box bg="white" rounded="xl" p={6} borderWidth={2} borderColor="amber.200" overflowY="auto" maxH="96" shadow="inner">
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
            <Box mt={10} pt={8} borderTopWidth={4} borderColor="amber.300" textAlign="center" bgGradient="linear(to-r, amber.50, orange.50)" mx={{ base: -8, md: -12 }} px={{ base: 8, md: 12 }} pb={8}>
              <HStack justify="center" spacing={3} color="amber.800" mb={3} flexWrap="wrap">
              <Gem size={24} color="#d97706" />
              <Text fontSize="base" fontWeight="bold">🔒 Your API keys stay secure - No data stored in our mines</Text>
              <Gem size={24} color="#d97706" />
            </HStack>
            <Text fontSize="base" color="amber.700" fontWeight="semibold" mt={2}>⏱️ Estimated prospecting time: 5-10 minutes per company</Text>
            <Text fontSize="sm" color="gray.600" mt={3}>⛏️ Built with FastAPI, React, Claude & GPT-4</Text>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ResearchApp;
