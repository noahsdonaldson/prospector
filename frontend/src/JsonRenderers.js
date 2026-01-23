import React from 'react';
import { Box, Heading, Text, VStack, HStack, Badge, Table, Thead, Tbody, Tr, Th, Td, UnorderedList, ListItem, Divider, Link } from '@chakra-ui/react';
import { ExternalLink, FileText } from 'lucide-react';

// Reusable Citations Component
const CitationsSection = ({ citations }) => {
  if (!citations || citations.length === 0) return null;
  
  return (
    <Box mt={6} pt={4} borderTopWidth={2} borderColor="gray.300">
      <HStack spacing={2} mb={3}>
        <FileText size={18} color="#4B5563" />
        <Heading size="sm" color="gray.700">Sources & Citations</Heading>
      </HStack>
      <VStack align="stretch" spacing={2}>
        {citations.map((citation, idx) => (
          <HStack key={idx} spacing={3} bg="gray.50" p={3} rounded="md" borderWidth={1} borderColor="gray.200">
            <Badge colorScheme="blue" fontSize="xs">{idx + 1}</Badge>
            <Box flex="1">
              <Link 
                href={citation.url} 
                isExternal 
                color="blue.600" 
                fontWeight="semibold" 
                fontSize="sm"
                _hover={{ color: 'blue.800', textDecoration: 'underline' }}
              >
                <HStack spacing={1}>
                  <Text>{citation.title}</Text>
                  <ExternalLink size={12} />
                </HStack>
              </Link>
              {citation.relevance_score && (
                <Text fontSize="xs" color="gray.500">
                  Relevance: {(citation.relevance_score * 100).toFixed(0)}%
                </Text>
              )}
            </Box>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};

// Render Step 1: Strategic Objectives
export const RenderStep1 = ({ data, citations }) => {
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
      
      <CitationsSection citations={citations} />
    </VStack>
  );
};

// Render Step 2: Business Unit Alignment
export const RenderStep2 = ({ data, citations }) => {
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
      
      <CitationsSection citations={citations} />
    </VStack>
  );
};

// Render Step 3: Business Unit Deep Dive
export const RenderStep3 = ({ data, citations }) => {
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
      
      <CitationsSection citations={citations} />
    </VStack>
  );
};

// Render Step 4: AI Alignment
export const RenderStep4 = ({ data, citations }) => {
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
      
      <CitationsSection citations={citations} />
    </VStack>
  );
};

// Render Step 5: Persona Mapping
export const RenderStep5 = ({ data, citations }) => {
  if (!data || typeof data !== 'object') return <Text color="red.500">Invalid data format</Text>;
  
  if (data.error || data.fallback) {
    return <Text color="orange.500">JSON parsing failed</Text>;
  }
  
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="gray.700">Buying Committee & Stakeholder Map</Heading>
      
      {data.buying_committee_summary && (
        <Box bg="purple.50" p={3} borderWidth={1} borderColor="purple.200" rounded="md">
          <Text fontSize="sm" fontWeight="semibold" color="purple.800">Decision Structure:</Text>
          <Text fontSize="sm">{data.buying_committee_summary}</Text>
        </Box>
      )}
      
      {data.personas && data.personas.length > 0 && (
        <VStack align="stretch" spacing={3}>
          {data.personas.map((persona, idx) => (
            <Box key={idx} bg="white" p={4} borderWidth={2} borderColor="gray.300" rounded="md" shadow="sm">
              <HStack justify="space-between" mb={3}>
                <Box>
                  <Heading size="sm" color="gray.800">{persona.name}</Heading>
                  <Text fontSize="sm" color="gray.600">{persona.title}</Text>
                  {persona.business_unit && <Badge colorScheme="blue" mt={1}>{persona.business_unit}</Badge>}
                </Box>
                <VStack align="end" spacing={1}>
                  <Badge colorScheme={persona.outreach_priority <= 2 ? "red" : persona.outreach_priority === 3 ? "orange" : "gray"}>
                    Priority: {persona.outreach_priority}
                  </Badge>
                  {persona.buying_role && <Badge colorScheme="purple">{persona.buying_role}</Badge>}
                  {persona.decision_authority && <Badge colorScheme="green">{persona.decision_authority}</Badge>}
                </VStack>
              </HStack>
              
              <VStack align="stretch" spacing={2}>
                {persona.reports_to && (
                  <Text fontSize="xs" color="gray.500">Reports to: {persona.reports_to}</Text>
                )}
                
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.700">Pain Point:</Text>
                  <Text fontSize="sm">{persona.pain_point}</Text>
                </Box>
                
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="gray.700">AI Solution:</Text>
                  <Text fontSize="sm" color="blue.700">{persona.ai_use_case}</Text>
                </Box>
                
                <HStack>
                  <Box flex="1">
                    <Text fontSize="xs" fontWeight="bold" color="gray.700">Expected Outcome:</Text>
                    <Text fontSize="sm" color="green.600" fontWeight="semibold">{persona.expected_outcome}</Text>
                  </Box>
                  <Box flex="1">
                    <Text fontSize="xs" fontWeight="bold" color="gray.700">Aligns to:</Text>
                    <Text fontSize="xs">{persona.strategic_alignment}</Text>
                  </Box>
                </HStack>
                
                {persona.engagement_approach && (
                  <Box bg="blue.50" p={2} rounded="md">
                    <Text fontSize="xs" fontWeight="bold" color="blue.800">Engagement Approach:</Text>
                    <Text fontSize="xs">{persona.engagement_approach}</Text>
                  </Box>
                )}
                
                {persona.potential_barriers && (
                  <Box bg="orange.50" p={2} rounded="md">
                    <Text fontSize="xs" fontWeight="bold" color="orange.800">Potential Barriers:</Text>
                    <Text fontSize="xs">{persona.potential_barriers}</Text>
                  </Box>
                )}
                
                {persona.value_hook && (
                  <Box bg="green.50" p={2} rounded="md" borderLeft="3px solid" borderColor="green.500">
                    <Text fontSize="xs" fontWeight="bold" color="green.800">Value Hook:</Text>
                    <Text fontSize="sm" fontStyle="italic">"{persona.value_hook}"</Text>
                  </Box>
                )}
                
                {persona.data_source && (
                  <Text fontSize="xs" color="gray.400">Source: {persona.data_source}</Text>
                )}
              </VStack>
            </Box>
          ))}
        </VStack>
      )}
      
      {data.research_note && (
        <Text fontSize="xs" color="gray.500" fontStyle="italic">{data.research_note}</Text>
      )}
      
      <CitationsSection citations={citations} />
    </VStack>
  );
};

// Render Step 6: Value Realization
export const RenderStep6 = ({ data, citations }) => {
  if (!data || typeof data !== 'object') return <Text color="red.500">Invalid data format</Text>;
  
  if (data.error || data.fallback) {
    return <Text color="orange.500">JSON parsing failed</Text>;
  }
  
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md" color="gray.700">Business Case & ROI Analysis</Heading>
      
      {data.executive_summary && (
        <Box bg="green.50" p={4} borderWidth={2} borderColor="green.400" rounded="md">
          <Text fontSize="sm" fontWeight="bold" color="green.800" mb={1}>Executive Summary</Text>
          <Text fontSize="md">{data.executive_summary}</Text>
        </Box>
      )}
      
      {data.value_realizations && data.value_realizations.length > 0 && (
        <VStack align="stretch" spacing={4}>
          {data.value_realizations.map((value, idx) => (
            <Box key={idx} bg="white" p={5} borderWidth={2} borderColor="gray.400" rounded="lg" shadow="md">
              <HStack justify="space-between" mb={3}>
                <Box>
                  <Heading size="md" color="gray.800">{value.use_case_name}</Heading>
                  {value.business_unit && <Badge colorScheme="blue" mt={1}>{value.business_unit}</Badge>}
                  {value.executive_sponsor && (
                    <Text fontSize="xs" color="gray.600" mt={1}>Executive Sponsor: {value.executive_sponsor}</Text>
                  )}
                </Box>
              </HStack>
              
              {value.problem_statement && (
                <Box mb={3}>
                  <Text fontSize="sm" fontWeight="bold" color="red.700">Problem:</Text>
                  <Text fontSize="sm">{value.problem_statement}</Text>
                </Box>
              )}
              
              {value.solution_overview && (
                <Box mb={3}>
                  <Text fontSize="sm" fontWeight="bold" color="blue.700">Solution:</Text>
                  <Text fontSize="sm">{value.solution_overview}</Text>
                </Box>
              )}
              
              {value.financial_impact && (
                <Box bg="green.50" p={3} rounded="md" mb={3}>
                  <Heading size="sm" color="green.800" mb={2}>💰 Financial Impact</Heading>
                  <VStack align="stretch" spacing={1}>
                    {value.financial_impact.annual_cost_savings && (
                      <HStack><Text fontSize="sm" fontWeight="bold">Cost Savings:</Text><Text fontSize="sm" color="green.700">{value.financial_impact.annual_cost_savings}</Text></HStack>
                    )}
                    {value.financial_impact.revenue_opportunity && (
                      <HStack><Text fontSize="sm" fontWeight="bold">Revenue Opportunity:</Text><Text fontSize="sm" color="green.700">{value.financial_impact.revenue_opportunity}</Text></HStack>
                    )}
                    {value.financial_impact.efficiency_gains && (
                      <HStack><Text fontSize="sm" fontWeight="bold">Efficiency Gains:</Text><Text fontSize="sm" color="green.700">{value.financial_impact.efficiency_gains}</Text></HStack>
                    )}
                    {value.financial_impact.payback_period && (
                      <HStack><Text fontSize="sm" fontWeight="bold">Payback Period:</Text><Text fontSize="sm" color="orange.700">{value.financial_impact.payback_period}</Text></HStack>
                    )}
                    {value.financial_impact["3_year_roi"] && (
                      <HStack><Text fontSize="sm" fontWeight="bold">3-Year ROI:</Text><Text fontSize="sm" color="green.800" fontWeight="bold">{value.financial_impact["3_year_roi"]}</Text></HStack>
                    )}
                  </VStack>
                </Box>
              )}
              
              {value.implementation && (
                <Box bg="blue.50" p={3} rounded="md" mb={3}>
                  <Heading size="sm" color="blue.800" mb={2}>🚀 Implementation Plan</Heading>
                  <VStack align="stretch" spacing={1}>
                    {value.implementation.timeline && (
                      <HStack><Text fontSize="sm" fontWeight="bold">Timeline:</Text><Text fontSize="sm">{value.implementation.timeline}</Text></HStack>
                    )}
                    {value.implementation.budget_required && (
                      <HStack><Text fontSize="sm" fontWeight="bold">Budget:</Text><Text fontSize="sm">{value.implementation.budget_required}</Text></HStack>
                    )}
                    {value.implementation.headcount_required && (
                      <HStack><Text fontSize="sm" fontWeight="bold">Headcount:</Text><Text fontSize="sm">{value.implementation.headcount_required}</Text></HStack>
                    )}
                    {value.implementation.technology_stack && value.implementation.technology_stack.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">Technology:</Text>
                        <HStack spacing={2} mt={1}>
                          {value.implementation.technology_stack.map((tech, i) => (
                            <Badge key={i} colorScheme="cyan" fontSize="xs">{tech}</Badge>
                          ))}
                        </HStack>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )}
              
              {value.success_metrics && value.success_metrics.length > 0 && (
                <Box mb={3}>
                  <Heading size="sm" color="gray.700" mb={2}>📊 Success Metrics</Heading>
                  <Table size="sm" variant="simple">
                    <Thead bg="gray.100">
                      <Tr>
                        <Th>Metric</Th>
                        <Th>Baseline</Th>
                        <Th>Target</Th>
                        <Th>Timeline</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {value.success_metrics.map((metric, i) => (
                        <Tr key={i}>
                          <Td fontSize="xs">{metric.metric}</Td>
                          <Td fontSize="xs">{metric.baseline}</Td>
                          <Td fontSize="xs" fontWeight="bold" color="green.600">{metric.target}</Td>
                          <Td fontSize="xs">{metric.timeline}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
              
              {value.risks_and_mitigation && value.risks_and_mitigation.length > 0 && (
                <Box bg="orange.50" p={3} rounded="md" mb={3}>
                  <Heading size="sm" color="orange.800" mb={2}>⚠️ Risks & Mitigation</Heading>
                  <VStack align="stretch" spacing={2}>
                    {value.risks_and_mitigation.map((risk, i) => (
                      <Box key={i} borderLeft="3px solid" borderColor="orange.400" pl={2}>
                        <HStack spacing={2} mb={1}>
                          <Badge colorScheme={risk.likelihood === "High" ? "red" : risk.likelihood === "Medium" ? "orange" : "yellow"} fontSize="xs">
                            {risk.likelihood}
                          </Badge>
                          <Badge colorScheme={risk.impact === "High" ? "red" : risk.impact === "Medium" ? "orange" : "yellow"} fontSize="xs">
                            Impact: {risk.impact}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" fontWeight="bold">{risk.risk}</Text>
                        <Text fontSize="xs" color="gray.600">Mitigation: {risk.mitigation}</Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
              
              {value.strategic_differentiation && (
                <Box bg="purple.50" p={3} rounded="md" mb={2}>
                  <Text fontSize="sm" fontWeight="bold" color="purple.800">🎯 Strategic Differentiation:</Text>
                  <Text fontSize="sm">{value.strategic_differentiation}</Text>
                </Box>
              )}
              
              {value.quick_wins && (
                <Box bg="yellow.50" p={3} rounded="md">
                  <Text fontSize="sm" fontWeight="bold" color="yellow.800">⚡ Quick Wins (30-60 days):</Text>
                  <Text fontSize="sm">{value.quick_wins}</Text>
                </Box>
              )}
            </Box>
          ))}
        </VStack>
      )}
      
      <CitationsSection citations={citations} />
    </VStack>
  );
};

// Render Step 7: Outreach Email
export const RenderStep7 = ({ data, citations }) => {
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
      
      <CitationsSection citations={citations} />
    </VStack>
  );
};
