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
  
  const addTable = (headers, rows) => {
    checkNewPage(20);
    const colCount = headers.length;
    const colWidth = maxWidth / colCount;
    
    // Header
    doc.setFillColor(75, 85, 99);
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
        doc.setFillColor(243, 244, 246);
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
  if (step5 && typeof step5 === 'object' && !step5.error && step5.personas) {
    addHeading('Target Personas', 1);
    
    const headers = ['Name', 'Title', 'Pain Point', 'Expected Outcome'];
    const rows = step5.personas.map(p => [
      p.name || '',
      p.title || '',
      p.pain_point || '',
      p.expected_outcome || ''
    ]);
    
    addTable(headers, rows);
    yPosition += 10;
  }
  
  // Step 6: Value Realization
  const step6 = results.steps.step6_value_realization?.data;
  if (step6 && typeof step6 === 'object' && !step6.error && step6.value_realizations) {
    addHeading('Value Realization Matrix', 1);
    
    const headers = ['Executive', 'Title', 'AI Solution', 'Expected Outcome'];
    const rows = step6.value_realizations.map(v => [
      v.name || '',
      v.title || '',
      v.ai_use_case || '',
      v.expected_outcome || ''
    ]);
    
    addTable(headers, rows);
    yPosition += 10;
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
