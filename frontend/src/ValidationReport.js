import React from 'react';
import {
  Box, VStack, HStack, Text, Heading, Badge, Divider, Progress,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  Alert, AlertIcon
} from '@chakra-ui/react';
import { CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';

const ValidationReport = ({ validation }) => {
  if (!validation) return null;

  const statusConfig = {
    GREEN: { color: 'green', icon: CheckCircle, bg: 'green.50', label: 'High Quality' },
    YELLOW: { color: 'yellow', icon: AlertTriangle, bg: 'yellow.50', label: 'Needs Improvement' },
    RED: { color: 'red', icon: XCircle, bg: 'red.50', label: 'Significant Issues' }
  };

  const getConfig = (status) => statusConfig[status] || statusConfig.YELLOW;
  const overallConfig = getConfig(validation.overall_status);
  const OverallIcon = overallConfig.icon;

  // Step name mapping
  const stepNames = {
    'step1_overview': 'Company Overview',
    'step2_business_priorities': 'Business Priorities',
    'step3_tech_stack': 'Technology Stack',
    'step4_ai_alignment': 'AI/Agentic AI Alignment',
    'step5_persona_mapping': 'Persona Mapping',
    'step6_value_realization': 'Business Case & ROI',
    'step7_outreach': 'Outreach Strategy'
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Score Legend */}
      <Box bg="gray.50" p={4} borderRadius="md">
        <Heading size="sm" mb={3}>Score Legend</Heading>
        <VStack spacing={2} align="stretch">
          <HStack>
            <CheckCircle size={18} color="#16a34a" />
            <Text fontSize="sm"><strong>Green (85-100):</strong> High quality, well-cited, accurate</Text>
          </HStack>
          <HStack>
            <AlertTriangle size={18} color="#ca8a04" />
            <Text fontSize="sm"><strong>Yellow (70-84):</strong> Good but has minor issues or gaps</Text>
          </HStack>
          <HStack>
            <XCircle size={18} color="#dc2626" />
            <Text fontSize="sm"><strong>Red (&lt;70):</strong> Significant issues, needs revision</Text>
          </HStack>
        </VStack>
      </Box>

      {/* Overall Score */}
      <Box
        bg={overallConfig.bg}
        p={6}
        borderRadius="md"
        borderWidth={2}
        borderColor={`${overallConfig.color}.400`}
      >
        <HStack justify="space-between" mb={4}>
          <HStack>
            <OverallIcon size={32} color={`var(--chakra-colors-${overallConfig.color}-600)`} />
            <VStack align="start" spacing={0}>
              <Heading size="lg">Overall Score: {validation.overall_score}/100</Heading>
              <Badge colorScheme={overallConfig.color} fontSize="md">{overallConfig.label}</Badge>
            </VStack>
          </HStack>
          <VStack align="end" spacing={0}>
            <Text fontSize="xs" color="gray.600">Validated by</Text>
            <Text fontSize="sm" fontWeight="600">{validation.judge_model}</Text>
            <Text fontSize="xs" color="gray.500">
              {new Date(validation.validation_timestamp).toLocaleString()}
            </Text>
          </VStack>
        </HStack>
        
        <Progress
          value={validation.overall_score}
          colorScheme={overallConfig.color}
          size="lg"
          borderRadius="full"
          mb={3}
        />

        {validation.overall_assessment && (
          <Text color="gray.700" mt={3}>{validation.overall_assessment}</Text>
        )}
      </Box>

      {/* Critical Issues */}
      {validation.critical_issues && validation.critical_issues.length > 0 && (
        <Alert status="error">
          <AlertIcon />
          <VStack align="start" spacing={1} flex={1}>
            <Text fontWeight="600">Critical Issues</Text>
            {validation.critical_issues.map((issue, idx) => (
              <Text key={idx} fontSize="sm">• {issue}</Text>
            ))}
          </VStack>
        </Alert>
      )}

      {/* Warnings */}
      {validation.warnings && validation.warnings.length > 0 && (
        <Alert status="warning">
          <AlertIcon />
          <VStack align="start" spacing={1} flex={1}>
            <Text fontWeight="600">Warnings</Text>
            {validation.warnings.map((warning, idx) => (
              <Text key={idx} fontSize="sm">• {warning}</Text>
            ))}
          </VStack>
        </Alert>
      )}

      {/* Recommendations */}
      {validation.recommendations && validation.recommendations.length > 0 && (
        <Box bg="blue.50" p={4} borderRadius="md" borderWidth={1} borderColor="blue.200">
          <HStack mb={2}>
            <TrendingUp size={20} color="#2563eb" />
            <Heading size="sm">Recommendations</Heading>
          </HStack>
          <VStack align="start" spacing={1}>
            {validation.recommendations.map((rec, idx) => (
              <Text key={idx} fontSize="sm" color="gray.700">• {rec}</Text>
            ))}
          </VStack>
        </Box>
      )}

      <Divider />

      {/* Individual Step Scores */}
      <Box>
        <Heading size="md" mb={4}>Step-by-Step Validation</Heading>
        <Accordion allowMultiple>
          {Object.entries(validation.step_validations || {}).map(([stepKey, stepData]) => {
            const config = getConfig(stepData.status);
            const StepIcon = config.icon;
            
            return (
              <AccordionItem key={stepKey} border="1px solid" borderColor="gray.200" mb={2} borderRadius="md">
                <AccordionButton _expanded={{ bg: config.bg }}>
                  <HStack flex={1} justify="space-between">
                    <HStack>
                      <StepIcon size={20} color={`var(--chakra-colors-${config.color}-600)`} />
                      <Text fontWeight="600">{stepNames[stepKey] || stepKey}</Text>
                    </HStack>
                    <HStack>
                      <Badge colorScheme={config.color}>{stepData.status}</Badge>
                      <Text fontWeight="700" color={`${config.color}.700`}>{stepData.score}/100</Text>
                      <AccordionIcon />
                    </HStack>
                  </HStack>
                </AccordionButton>
                <AccordionPanel pb={4} bg="white">
                  <VStack align="stretch" spacing={3}>
                    {/* Strengths */}
                    {stepData.strengths && stepData.strengths.length > 0 && (
                      <Box>
                        <Text fontWeight="600" color="green.700" mb={1}>✓ Strengths</Text>
                        <VStack align="start" spacing={1} pl={4}>
                          {stepData.strengths.map((strength, idx) => (
                            <Text key={idx} fontSize="sm" color="gray.700">• {strength}</Text>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* Issues */}
                    {stepData.issues && stepData.issues.length > 0 && (
                      <Box>
                        <Text fontWeight="600" color="red.700" mb={1}>⚠ Issues</Text>
                        <VStack align="start" spacing={1} pl={4}>
                          {stepData.issues.map((issue, idx) => (
                            <Text key={idx} fontSize="sm" color="gray.700">• {issue}</Text>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* Recommendations */}
                    {stepData.recommendations && stepData.recommendations.length > 0 && (
                      <Box>
                        <Text fontWeight="600" color="blue.700" mb={1}>→ Recommendations</Text>
                        <VStack align="start" spacing={1} pl={4}>
                          {stepData.recommendations.map((rec, idx) => (
                            <Text key={idx} fontSize="sm" color="gray.700">• {rec}</Text>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>
      </Box>
    </VStack>
  );
};

export default ValidationReport;
