import { jsPDF } from 'jspdf';

export const generatePDFFromJSON = (results) => {
  if (!results) return;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - (2 * margin);
  let yPosition = 20;
  
  const checkNewPage = (spaceNeeded = 20) => {
    if (yPosition > pageHeight - spaceNeeded) {
      doc.addPage();
      yPosition = 20;
    }
  };
  
  const addHeading = (text, level = 1) => {
    checkNewPage(15);
    const sizes = { 1: 16, 2: 14, 3: 12 };
    doc.setFontSize(sizes[level] || 12);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, yPosition);
    yPosition += level === 1 ? 10 : 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
  };
  
  const addText = (text, indent = 0) => {
    if (!text) return;
    checkNewPage();
    const lines = doc.splitTextToSize(text, maxWidth - indent);
    lines.forEach((line) => {
      checkNewPage();
      doc.text(line, margin + indent, yPosition);
      yPosition += 5;
    });
  };
  
  const addBulletPoint = (text, indent = 0) => {
    checkNewPage();
    doc.circle(margin + indent + 2, yPosition - 1.5, 0.8, 'F');
    const lines = doc.splitTextToSize(text, maxWidth - indent - 5);
    lines.forEach((line, idx) => {
      checkNewPage();
      doc.text(line, margin + indent + 5, yPosition);
      yPosition += 5;
    });
  };
  
  // Color definitions matching Chakra UI theme
  const colors = {
    green: { bg: [240, 253, 244], border: [74, 222, 128], text: [22, 101, 52] },
    blue: { bg: [239, 246, 255], border: [96, 165, 250], text: [30, 64, 175] },
    purple: { bg: [250, 245, 255], border: [192, 132, 252], text: [107, 33, 168] },
    orange: { bg: [255, 247, 237], border: [251, 146, 60], text: [154, 52, 18] },
    yellow: { bg: [254, 252, 232], border: [250, 204, 21], text: [161, 98, 7] },
    red: { bg: [254, 242, 242], border: [248, 113, 113], text: [153, 27, 27] },
    gray: { bg: [249, 250, 251], border: [209, 213, 219], text: [55, 65, 81] }
  };
  
  const addColoredBox = (text, colorScheme = 'gray', options = {}) => {
    checkNewPage(15);
    const color = colors[colorScheme] || colors.gray;
    const boxPadding = 3;
    const lines = doc.splitTextToSize(text, maxWidth - (2 * boxPadding));
    const boxHeight = (lines.length * 5) + (2 * boxPadding);
    
    // Background
    doc.setFillColor(...color.bg);
    doc.rect(margin, yPosition - boxPadding, maxWidth, boxHeight, 'F');
    
    // Border
    if (options.border) {
      doc.setDrawColor(...color.border);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition - boxPadding, maxWidth, boxHeight);
    }
    
    // Text
    doc.setTextColor(...color.text);
    if (options.bold) doc.setFont('helvetica', 'bold');
    lines.forEach((line) => {
      doc.text(line, margin + boxPadding, yPosition);
      yPosition += 5;
    });
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    yPosition += boxPadding + 2;
  };
  
  const addBadge = (text, colorScheme = 'gray') => {
    const color = colors[colorScheme] || colors.gray;
    doc.setFillColor(...color.bg);
    doc.setDrawColor(...color.border);
    doc.setLineWidth(0.3);
    const badgeWidth = doc.getTextWidth(text) + 4;
    doc.roundedRect(margin, yPosition - 4, badgeWidth, 5, 1, 1, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(...color.text);
    doc.text(text, margin + 2, yPosition - 1);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    return badgeWidth + 2;
  };
  
  const addTable = (headers, rows) => {
    checkNewPage(20);
    const colCount = headers.length;
    const colWidth = maxWidth / colCount;
    
    // Header
    doc.setFillColor(55, 65, 81); // gray.700
    doc.rect(margin, yPosition - 5, maxWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    
    headers.forEach((header, idx) => {
      doc.text(header, margin + (idx * colWidth) + 2, yPosition);
    });
    
    yPosition += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Rows
    rows.forEach((row, rowIdx) => {
      checkNewPage(10);
      const rowHeight = 6;
      
      if (rowIdx % 2 === 1) {
        doc.setFillColor(249, 250, 251); // gray.50
        doc.rect(margin, yPosition - 4, maxWidth, rowHeight, 'F');
      }
      
      row.forEach((cell, colIdx) => {
        const cellText = doc.splitTextToSize(cell || '', colWidth - 4);
        doc.text(cellText[0] || '', margin + (colIdx * colWidth) + 2, yPosition);
      });
      
      yPosition += rowHeight;
    });
    
    yPosition += 5;
  };
  
  // Title Page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${results.company_name} Research Report`, margin, yPosition);
  yPosition += 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 8;
  
  if (results.industry) {
    doc.text(`Industry: ${results.industry}`, margin, yPosition);
    yPosition += 8;
  }
  
  doc.text(`LLM Provider: ${results.llm_provider}`, margin, yPosition);
  yPosition += 15;
  
  // Step 1: Strategic Objectives
  const step1 = results.steps.step1_strategic_objectives?.data;
  if (step1 && typeof step1 === 'object' && !step1.error) {
    addHeading('Strategic Objectives', 1);
    
    if (step1.strategy_horizon) {
      addText(`Strategy Horizon: ${step1.strategy_horizon}`);
      yPosition += 3;
    }
    
    if (step1.objectives && Array.isArray(step1.objectives)) {
      step1.objectives.forEach((obj) => {
        addHeading(obj.objective, 3);
        addText(obj.description);
        
        if (obj.target_metrics && obj.target_metrics.length > 0) {
          yPosition += 2;
          addText('Target Metrics:', 0);
          obj.target_metrics.forEach((metric) => addBulletPoint(metric, 2));
        }
        
        yPosition += 5;
      });
    }
    
    yPosition += 10;
  }
  
  // Step 2: Business Unit Alignment
  const step2 = results.steps.step2_bu_alignment?.data;
  if (step2 && typeof step2 === 'object' && !step2.error && step2.business_units) {
    addHeading('Business Unit Alignment', 1);
    
    const headers = ['Business Unit', 'Primary Focus', 'Strategic Alignment'];
    const rows = step2.business_units.map(bu => [
      bu.name || '',
      bu.primary_focus || '',
      bu.strategic_alignment || ''
    ]);
    
    addTable(headers, rows);
    yPosition += 10;
  }
  
  // Step 3: Business Unit Deep Dive
  const step3 = results.steps.step3_bu_deepdive?.data;
  if (step3 && typeof step3 === 'object') {
    Object.entries(step3).forEach(([buName, buData]) => {
      const buContent = buData.data || buData;
      if (!buContent || typeof buContent !== 'object') return;
      
      addHeading(`${buName} - Deep Dive`, 1);
      
      if (buContent.main_objectives && Array.isArray(buContent.main_objectives)) {
        addHeading('Main Objectives', 2);
        buContent.main_objectives.forEach((obj) => {
          addBulletPoint(`${obj.objective}: ${obj.description} (${obj.timeline})`);
        });
        yPosition += 5;
      }
      
      if (buContent.key_metrics && Array.isArray(buContent.key_metrics)) {
        addHeading('Key Metrics', 2);
        const metricHeaders = ['Metric', 'Current', 'Target'];
        const metricRows = buContent.key_metrics.map(m => [
          m.metric || '',
          m.current_value || '',
          m.target || ''
        ]);
        addTable(metricHeaders, metricRows);
      }
      
      yPosition += 10;
    });
  }
  
  // Step 4: AI Alignment
  const step4 = results.steps.step4_ai_alignment?.data;
  if (step4 && typeof step4 === 'object' && !step4.error && step4.ai_use_cases) {
    addHeading('AI/Agentic AI Use Cases', 1);
    
    step4.ai_use_cases.forEach((useCase) => {
      addHeading(useCase.ai_use_case, 3);
      addText(`Objective: ${useCase.objective}`);
      addText(`Expected Outcome: ${useCase.expected_outcome}`);
      addText(`Strategic Alignment: ${useCase.strategic_alignment}`, 2);
      yPosition += 5;
    });
    
    yPosition += 10;
  }
  
  // Step 5: Persona Mapping
  const step5 = results.steps.step5_persona_mapping?.data;
  if (step5 && typeof step5 === 'object' && !step5.error) {
    addHeading('Buying Committee & Stakeholder Map', 1);
    
    if (step5.buying_committee_summary) {
      addColoredBox(step5.buying_committee_summary, 'purple', { border: true, bold: false });
      yPosition += 3;
    }
    
    if (step5.personas && step5.personas.length > 0) {
      step5.personas.forEach((persona) => {
        checkNewPage(40);
        
        // Name and Title
        addHeading(`${persona.name}`, 2);
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128); // gray.600
        addText(persona.title, 2);
        doc.setTextColor(0, 0, 0);
        yPosition += 2;
        
        // Badges
        let xOffset = margin + 2;
        if (persona.outreach_priority) {
          const priorityColor = persona.outreach_priority <= 2 ? 'red' : persona.outreach_priority === 3 ? 'orange' : 'gray';
          const priorityText = `Priority: ${persona.outreach_priority}`;
          doc.setFillColor(...colors[priorityColor].bg);
          doc.setDrawColor(...colors[priorityColor].border);
          const badgeWidth = doc.getTextWidth(priorityText) + 4;
          doc.roundedRect(xOffset, yPosition - 4, badgeWidth, 5, 1, 1, 'FD');
          doc.setFontSize(8);
          doc.setTextColor(...colors[priorityColor].text);
          doc.text(priorityText, xOffset + 2, yPosition - 1);
          xOffset += badgeWidth + 3;
        }
        if (persona.buying_role) {
          doc.setFillColor(...colors.purple.bg);
          doc.setDrawColor(...colors.purple.border);
          const badgeWidth = doc.getTextWidth(persona.buying_role) + 4;
          doc.roundedRect(xOffset, yPosition - 4, badgeWidth, 5, 1, 1, 'FD');
          doc.setTextColor(...colors.purple.text);
          doc.text(persona.buying_role, xOffset + 2, yPosition - 1);
          xOffset += badgeWidth + 3;
        }
        if (persona.decision_authority) {
          doc.setFillColor(...colors.green.bg);
          doc.setDrawColor(...colors.green.border);
          const badgeWidth = doc.getTextWidth(persona.decision_authority) + 4;
          doc.roundedRect(xOffset, yPosition - 4, badgeWidth, 5, 1, 1, 'FD');
          doc.setTextColor(...colors.green.text);
          doc.text(persona.decision_authority, xOffset + 2, yPosition - 1);
        }
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        yPosition += 5;
        
        if (persona.reports_to) {
          doc.setFontSize(9);
          doc.setTextColor(156, 163, 175);
          addText(`Reports to: ${persona.reports_to}`, 2);
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
        }
        
        yPosition += 2;
        doc.setFont('helvetica', 'bold');
        addText('Pain Point:', 2);
        doc.setFont('helvetica', 'normal');
        addText(persona.pain_point, 2);
        
        yPosition += 1;
        doc.setFont('helvetica', 'bold');
        addText('AI Solution:', 2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(29, 78, 216); // blue.700
        addText(persona.ai_use_case, 2);
        doc.setTextColor(0, 0, 0);
        
        yPosition += 1;
        doc.setFont('helvetica', 'bold');
        addText('Expected Outcome:', 2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(22, 163, 74); // green.600
        doc.setFont('helvetica', 'bold');
        addText(persona.expected_outcome, 2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        if (persona.engagement_approach) {
          yPosition += 2;
          addColoredBox(`Engagement Approach: ${persona.engagement_approach}`, 'blue', { border: false });
        }
        if (persona.potential_barriers) {
          yPosition += 1;
          addColoredBox(`Potential Barriers: ${persona.potential_barriers}`, 'orange', { border: false });
        }
        if (persona.value_hook) {
          yPosition += 1;
          const boxPadding = 3;
          const lines = doc.splitTextToSize(`"${persona.value_hook}"`, maxWidth - (2 * boxPadding));
          const boxHeight = (lines.length * 5) + (2 * boxPadding) + 5;
          
          doc.setFillColor(...colors.green.bg);
          doc.rect(margin, yPosition - boxPadding, maxWidth, boxHeight, 'F');
          doc.setDrawColor(...colors.green.border);
          doc.setLineWidth(2);
          doc.line(margin, yPosition - boxPadding, margin, yPosition - boxPadding + boxHeight);
          
          doc.setTextColor(...colors.green.text);
          doc.setFont('helvetica', 'bold');
          doc.text('Value Hook:', margin + boxPadding, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'italic');
          lines.forEach((line) => {
            doc.text(line, margin + boxPadding, yPosition);
            yPosition += 5;
          });
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          yPosition += boxPadding + 2;
        }
        
        yPosition += 5;
      });
    }
    
    yPosition += 5;
  }
  
  // Step 6: Value Realization (Business Case)
  const step6 = results.steps.step6_value_realization?.data;
  if (step6 && typeof step6 === 'object' && !step6.error) {
    addHeading('Business Case & ROI Analysis', 1);
    
    if (step6.executive_summary) {
      const boxPadding = 4;
      const lines = doc.splitTextToSize(step6.executive_summary, maxWidth - (2 * boxPadding));
      const boxHeight = (lines.length * 5) + (2 * boxPadding) + 8;
      
      checkNewPage(boxHeight + 5);
      doc.setFillColor(...colors.green.bg);
      doc.rect(margin, yPosition - boxPadding, maxWidth, boxHeight, 'F');
      doc.setDrawColor(...colors.green.border);
      doc.setLineWidth(1);
      doc.rect(margin, yPosition - boxPadding, maxWidth, boxHeight);
      
      doc.setTextColor(...colors.green.text);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Executive Summary', margin + boxPadding, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      lines.forEach((line) => {
        doc.text(line, margin + boxPadding, yPosition);
        yPosition += 5;
      });
      
      doc.setTextColor(0, 0, 0);
      yPosition += boxPadding + 5;
    }
    
    if (step6.value_realizations && step6.value_realizations.length > 0) {
      step6.value_realizations.forEach((value) => {
        checkNewPage(50);
        
        addHeading(value.use_case_name, 2);
        
        if (value.business_unit || value.executive_sponsor) {
          let xOffset = margin + 2;
          if (value.business_unit) {
            doc.setFillColor(...colors.blue.bg);
            doc.setDrawColor(...colors.blue.border);
            const badgeWidth = doc.getTextWidth(value.business_unit) + 4;
            doc.roundedRect(xOffset, yPosition - 4, badgeWidth, 5, 1, 1, 'FD');
            doc.setFontSize(8);
            doc.setTextColor(...colors.blue.text);
            doc.text(value.business_unit, xOffset + 2, yPosition - 1);
            xOffset += badgeWidth + 3;
          }
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          yPosition += 3;
          
          if (value.executive_sponsor) {
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128);
            addText(`Executive Sponsor: ${value.executive_sponsor}`, 2);
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
          }
        }
        
        yPosition += 2;
        if (value.problem_statement) {
          doc.setTextColor(185, 28, 28); // red.700
          doc.setFont('helvetica', 'bold');
          addText('Problem:', 2);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          addText(value.problem_statement, 2);
        }
        if (value.solution_overview) {
          yPosition += 1;
          doc.setTextColor(29, 78, 216); // blue.700
          doc.setFont('helvetica', 'bold');
          addText('Solution:', 2);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          addText(value.solution_overview, 2);
        }
        
        if (value.financial_impact) {
          yPosition += 3;
          const boxPadding = 3;
          let boxContent = '💰 Financial Impact\n';
          if (value.financial_impact.annual_cost_savings) 
            boxContent += `• Cost Savings: ${value.financial_impact.annual_cost_savings}\n`;
          if (value.financial_impact.revenue_opportunity) 
            boxContent += `• Revenue: ${value.financial_impact.revenue_opportunity}\n`;
          if (value.financial_impact.efficiency_gains) 
            boxContent += `• Efficiency: ${value.financial_impact.efficiency_gains}\n`;
          if (value.financial_impact.payback_period) 
            boxContent += `• Payback: ${value.financial_impact.payback_period}\n`;
          if (value.financial_impact["3_year_roi"]) 
            boxContent += `• 3-Year ROI: ${value.financial_impact["3_year_roi"]}`;
          
          const lines = doc.splitTextToSize(boxContent, maxWidth - (2 * boxPadding));
          const boxHeight = (lines.length * 5) + (2 * boxPadding);
          
          checkNewPage(boxHeight + 5);
          doc.setFillColor(...colors.green.bg);
          doc.rect(margin, yPosition - boxPadding, maxWidth, boxHeight, 'F');
          
          doc.setTextColor(...colors.green.text);
          doc.setFont('helvetica', 'bold');
          doc.text('💰 Financial Impact', margin + boxPadding, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          
          if (value.financial_impact.annual_cost_savings) {
            addBulletPoint(`Cost Savings: ${value.financial_impact.annual_cost_savings}`, boxPadding);
          }
          if (value.financial_impact.revenue_opportunity) {
            addBulletPoint(`Revenue: ${value.financial_impact.revenue_opportunity}`, boxPadding);
          }
          if (value.financial_impact.efficiency_gains) {
            addBulletPoint(`Efficiency: ${value.financial_impact.efficiency_gains}`, boxPadding);
          }
          if (value.financial_impact.payback_period) {
            addBulletPoint(`Payback: ${value.financial_impact.payback_period}`, boxPadding);
          }
          if (value.financial_impact["3_year_roi"]) {
            doc.setFont('helvetica', 'bold');
            addBulletPoint(`3-Year ROI: ${value.financial_impact["3_year_roi"]}`, boxPadding);
            doc.setFont('helvetica', 'normal');
          }
          
          doc.setTextColor(0, 0, 0);
          yPosition += boxPadding + 2;
        }
        
        if (value.implementation) {
          yPosition += 2;
          const boxPadding = 3;
          const boxHeight = 30;
          
          checkNewPage(boxHeight);
          doc.setFillColor(...colors.blue.bg);
          doc.rect(margin, yPosition - boxPadding, maxWidth, boxHeight, 'F');
          
          doc.setTextColor(...colors.blue.text);
          doc.setFont('helvetica', 'bold');
          doc.text('🚀 Implementation Plan', margin + boxPadding, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          
          if (value.implementation.timeline) {
            addBulletPoint(`Timeline: ${value.implementation.timeline}`, boxPadding);
          }
          if (value.implementation.budget_required) {
            addBulletPoint(`Budget: ${value.implementation.budget_required}`, boxPadding);
          }
          if (value.implementation.headcount_required) {
            addBulletPoint(`Headcount: ${value.implementation.headcount_required}`, boxPadding);
          }
          
          doc.setTextColor(0, 0, 0);
          yPosition += boxPadding + 2;
        }
        
        if (value.success_metrics && value.success_metrics.length > 0) {
          yPosition += 2;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          addText('📊 Success Metrics', 2);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          yPosition += 2;
          
          value.success_metrics.forEach((metric) => {
            doc.setTextColor(22, 163, 74);
            addBulletPoint(`${metric.metric}: ${metric.baseline} → ${metric.target} (${metric.timeline})`, 4);
            doc.setTextColor(0, 0, 0);
          });
        }
        
        if (value.risks_and_mitigation && value.risks_and_mitigation.length > 0) {
          yPosition += 2;
          const boxPadding = 3;
          
          checkNewPage(20);
          doc.setFillColor(...colors.orange.bg);
          doc.rect(margin, yPosition - boxPadding, maxWidth, 8, 'F');
          
          doc.setTextColor(...colors.orange.text);
          doc.setFont('helvetica', 'bold');
          doc.text('⚠️ Risks & Mitigation', margin + boxPadding, yPosition);
          yPosition += 6;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          value.risks_and_mitigation.forEach((risk) => {
            checkNewPage(15);
            doc.setFillColor(...colors.orange.bg);
            const riskHeight = 12;
            doc.rect(margin + 2, yPosition - 2, maxWidth - 4, riskHeight, 'F');
            doc.setDrawColor(...colors.orange.border);
            doc.setLineWidth(2);
            doc.line(margin + 2, yPosition - 2, margin + 2, yPosition - 2 + riskHeight);
            
            doc.setFont('helvetica', 'bold');
            doc.text(risk.risk, margin + 6, yPosition);
            yPosition += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`Mitigation: ${risk.mitigation}`, margin + 6, yPosition);
            doc.setFontSize(10);
            yPosition += 10;
          });
          
          yPosition += 2;
        }
        
        if (value.strategic_differentiation) {
          yPosition += 2;
          addColoredBox(`🎯 Strategic Differentiation: ${value.strategic_differentiation}`, 'purple', { border: false, bold: false });
        }
        
        if (value.quick_wins) {
          yPosition += 1;
          addColoredBox(`⚡ Quick Wins (30-60 days): ${value.quick_wins}`, 'yellow', { border: false, bold: false });
        }
        
        yPosition += 8;
      });
    }
  }
  
  // Step 7: Outreach Email
  const step7 = results.steps.step7_outreach_email?.data;
  if (step7 && typeof step7 === 'object' && !step7.error) {
    addHeading('Personalized Outreach Email', 1);
    
    if (step7.primary_persona) {
      addText(`To: ${step7.primary_persona}`);
      yPosition += 3;
    }
    
    if (step7.subject_line) {
      addText(`Subject: ${step7.subject_line}`);
      yPosition += 5;
    }
    
    if (step7.email_body) {
      addText(step7.email_body);
    }
  }
  
  // Save the PDF
  doc.save(`${results.company_name}_research.pdf`);
};
