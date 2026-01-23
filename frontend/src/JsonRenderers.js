import React from 'react';
import { Box, Heading, Text, VStack, HStack, Badge, Table, Thead, Tbody, Tr, Th, Td, UnorderedList, ListItem, Divider } from '@chakra-ui/react';

// Render Step 1: Strategic Objectives
export const RenderStep1 = ({ data }) => {
  if (!data || typeof data !== 'object') return <Text color="red.500">Invalid data format</Text>;
  
  if (data.error || data.fallback) {
    return <Text color="orange.500">JSON parsing failed. Raw data: {JSON.stringify(data.raw_response || data, null, 2)}</Text>;
  }
  
  return (
    <VStack align="stretch" spacing={4}>
      <HStack>
        <Heading size="md" color="gray.700">Company: {data.company}</Heading>
        {data.industry && <Badge colorScheme="blue">{data.industry}</Badge>}
      </HStack>
      
      {data.strategy_horizon && (
        <Text fontSize="sm" color="gray.600" fontStyle="italic">Strategy Horizon: {data.strategy_horizon}</Text>
      )}
      
      {data.objectives && data.objectives.length > 0 && (
        <Box>
          <Heading size="sm" color="gray.700" mb={3}>Strategic Objectives</Heading>
          <VStack align="stretch" spacing={4}>
            {data.objectives.map((obj, idx) => (
              <Box key={idx} bg="white" p={4} borderWidth={1} borderColor="gray.200" rounded="md">
                <Heading size="sm" color="gray.800" mb={2}>{obj.objective}</Heading>
                <Text fontSize="sm" mb={2}>{obj.description}</Text>
                
                {obj.target_metrics && obj.target_metrics.length > 0 && (
                  <Box mt={2}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Target Metrics:</Text>
                    <UnorderedList fontSize="sm" spacing={1}>
                      {obj.target_metrics.map((metric, i) => (
                        <ListItem key={i}>{metric}</ListItem>
                      ))}
                    </UnorderedList>
                  </Box>
                )}
                
                {obj.primary_sources && obj.primary_sources.length > 0 && (
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    Sources: {obj.primary_sources.join(', ')}
                  </Text>
                )}
              </Box>
            ))}
          </VStack>
        </Box>
      )}
      
      {data.data_quality_note && (
        <Text fontSize="xs" color="gray.500" fontStyle="italic">{data.data_quality_note}</Text>
      )}
    </VStack>
  );
};

// Render Step 2: Business Unit Alignment
export const RenderStep2 = ({ data }) => {
  if (!data || typeof data !== 'object') return <Text color="red.500">Invalid data format</Text>;
  
  if (data.error || data.fallback) {
    return <Text color="orange.500">JSON parsing failed</Text>;
  }
  
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="gray.700">Business Unit Alignment</Heading>
      
      {data.business_units && data.business_units.length > 0 && (
        <Table variant="simple" size="sm">
          <Thead bg="gray.700">
            <Tr>
              <Th color="white">Business Unit</Th>
              <Th color="white">Primary Focus</Th>
              <Th color="white">Strategic Alignment</Th>
              <Th color="white">Core Metrics</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.business_units.map((bu, idx) => (
              <Tr key={idx} bg={idx % 2 === 1 ? 'gray.50' : 'white'}>
                <Td fontWeight="semibold">{bu.name}</Td>
                <Td>{bu.primary_focus}</Td>
                <Td>{bu.strategic_alignment}</Td>
                <Td>
                  {bu.core_metrics && bu.core_metrics.length > 0 && (
                    <UnorderedList fontSize="xs">
                      {bu.core_metrics.map((metric, i) => (
                        <ListItem key={i}>{metric}</ListItem>
                      ))}
                    </UnorderedList>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </VStack>
  );
};

// Render Step 3: Business Unit Deep Dive
export const RenderStep3 = ({ data }) => {
  if (!data || typeof data !== 'object') return <Text color="red.500">Invalid data format</Text>;
  
  return (
    <VStack align="stretch" spacing={6}>
      {Object.entries(data).map(([buName, buData]) => {
        const buContent = buData.data || buData;
        if (!buContent || typeof buContent !== 'object') return null;
        
        return (
          <Box key={buName} bg="white" p={4} borderWidth={2} borderColor="gray.300" rounded="lg">
            <Heading size="md" color="gray.700" mb={4}>{buName}</Heading>
            
            {buContent.main_objectives && buContent.main_objectives.length > 0 && (
              <Box mb={4}>
                <Heading size="sm" color="gray.700" mb={2}>Main Objectives</Heading>
                <VStack align="stretch" spacing={2}>
                  {buContent.main_objectives.map((obj, idx) => (
                    <Box key={idx} pl={4} borderLeftWidth={3} borderColor="blue.400">
                      <Text fontWeight="semibold">{obj.objective}</Text>
                      <Text fontSize="sm" color="gray.600">{obj.description}</Text>
                      <Text fontSize="xs" color="gray.500" fontStyle="italic">{obj.timeline}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
            
            {buContent.key_metrics && buContent.key_metrics.length > 0 && (
              <Box mb={4}>
                <Heading size="sm" color="gray.700" mb={2}>Key Metrics</Heading>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Metric</Th>
                      <Th>Current</Th>
                      <Th>Target</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {buContent.key_metrics.map((metric, idx) => (
                      <Tr key={idx}>
                        <Td>{metric.metric}</Td>
                        <Td>{metric.current_value}</Td>
                        <Td>{metric.target}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
            
            {buContent.challenges && buContent.challenges.length > 0 && (
              <Box>
                <Heading size="sm" color="gray.700" mb={2}>Key Challenges</Heading>
                <VStack align="stretch" spacing={2}>
                  {buContent.challenges.map((challenge, idx) => (
                    <Box key={idx} bg="red.50" p={3} rounded="md" borderWidth={1} borderColor="red.200">
                      <Badge colorScheme="red" mb={1}>{challenge.category}</Badge>
                      <Text fontSize="sm" fontWeight="semibold">{challenge.challenge}</Text>
                      <Text fontSize="xs" color="gray.600">{challenge.impact}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </Box>
        );
      })}
    </VStack>
  );
};

// Render Step 4: AI Alignment
export const RenderStep4 = ({ data }) => {
  if (!data || typeof data !== 'object') return <Text color="red.500">Invalid data format</Text>;
  
  if (data.error || data.fallback) {
    return <Text color="orange.500">JSON parsing failed</Text>;
  }
  
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="gray.700">AI/Agentic AI Use Cases</Heading>
      
      {data.focus_period && (
        <Text fontSize="sm" color="gray.600" fontStyle="italic">Focus: {data.focus_period}</Text>
      )}
      
      {data.ai_use_cases && data.ai_use_cases.length > 0 && (
        <VStack align="stretch" spacing={3}>
          {data.ai_use_cases.map((useCase, idx) => (
            <Box key={idx} bg="blue.50" p={4} borderWidth={1} borderColor="blue.200" rounded="md">
              <HStack justify="space-between" mb={2}>
                <Heading size="sm" color="blue.800">{useCase.ai_use_case}</Heading>
                {useCase.business_unit && <Badge colorScheme="purple">{useCase.business_unit}</Badge>}
              </HStack>
              <Text fontSize="sm" mb={2}><strong>Objective:</strong> {useCase.objective}</Text>
              <Text fontSize="sm" mb={2}><strong>Expected Outcome:</strong> {useCase.expected_outcome}</Text>
              <Text fontSize="xs" color="gray.600"><strong>Aligns to:</strong> {useCase.strategic_alignment}</Text>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
};

// Render Step 5: Persona Mapping
export const RenderStep5 = ({ data }) => {
  if (!data || typeof data !== 'object') return <Text color="red.500">Invalid data format</Text>;
  
  if (data.error || data.fallback) {
    return <Text color="orange.500">JSON parsing failed</Text>;
  }
  
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="gray.700">Target Personas & Value Propositions</Heading>
      
      {data.personas && data.personas.length > 0 && (
        <Table variant="simple" size="sm">
          <Thead bg="gray.700">
            <Tr>
              <Th color="white">Name</Th>
              <Th color="white">Title</Th>
              <Th color="white">Pain Point</Th>
              <Th color="white">AI Solution</Th>
              <Th color="white">Expected Impact</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.personas.map((persona, idx) => (
              <Tr key={idx} bg={idx % 2 === 1 ? 'gray.50' : 'white'}>
                <Td fontWeight="semibold">{persona.name}</Td>
                <Td>{persona.title}</Td>
                <Td fontSize="sm">{persona.pain_point}</Td>
                <Td fontSize="sm">{persona.ai_use_case}</Td>
                <Td fontSize="sm" color="green.600" fontWeight="semibold">{persona.expected_outcome}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      
      {data.research_note && (
        <Text fontSize="xs" color="gray.500" fontStyle="italic">{data.research_note}</Text>
      )}
    </VStack>
  );
};

// Render Step 6: Value Realization
export const RenderStep6 = ({ data }) => {
  if (!data || typeof data !== 'object') return <Text color="red.500">Invalid data format</Text>;
  
  if (data.error || data.fallback) {
    return <Text color="orange.500">JSON parsing failed</Text>;
  }
  
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="gray.700">Value Realization Matrix</Heading>
      
      {data.value_realizations && data.value_realizations.length > 0 && (
        <Table variant="simple" size="sm">
          <Thead bg="gray.700">
            <Tr>
              <Th color="white">Executive</Th>
              <Th color="white">Title</Th>
              <Th color="white">Pain Point</Th>
              <Th color="white">AI Solution</Th>
              <Th color="white">Expected Outcome</Th>
              <Th color="white">Strategic Alignment</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.value_realizations.map((value, idx) => (
              <Tr key={idx} bg={idx % 2 === 1 ? 'gray.50' : 'white'}>
                <Td fontWeight="semibold">{value.name}</Td>
                <Td>{value.title}</Td>
                <Td fontSize="sm">{value.pain_point}</Td>
                <Td fontSize="sm">{value.ai_use_case}</Td>
                <Td fontSize="sm" color="green.600" fontWeight="semibold">{value.expected_outcome}</Td>
                <Td fontSize="xs">{value.strategic_alignment}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </VStack>
  );
};

// Render Step 7: Outreach Email
export const RenderStep7 = ({ data }) => {
  if (!data || typeof data !== 'object') return <Text color="red.500">Invalid data format</Text>;
  
  if (data.error || data.fallback) {
    return <Text color="orange.500">JSON parsing failed</Text>;
  }
  
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="gray.700">Personalized Outreach Email</Heading>
      
      {data.primary_persona && (
        <Box bg="blue.50" p={3} rounded="md">
          <Text fontSize="sm"><strong>To:</strong> {data.primary_persona}</Text>
        </Box>
      )}
      
      {data.subject_line && (
        <Box>
          <Text fontSize="xs" color="gray.600" fontWeight="bold" mb={1}>Subject:</Text>
          <Text fontSize="sm" fontWeight="semibold">{data.subject_line}</Text>
        </Box>
      )}
      
      <Divider />
      
      {data.email_body && (
        <Box bg="white" p={4} borderWidth={1} borderColor="gray.300" rounded="md">
          <Text fontSize="sm" whiteSpace="pre-wrap">{data.email_body}</Text>
        </Box>
      )}
      
      {data.key_talking_points && data.key_talking_points.length > 0 && (
        <Box>
          <Heading size="sm" color="gray.700" mb={2}>Key Talking Points</Heading>
          <UnorderedList>
            {data.key_talking_points.map((point, idx) => (
              <ListItem key={idx} fontSize="sm">{point}</ListItem>
            ))}
          </UnorderedList>
        </Box>
      )}
    </VStack>
  );
};
