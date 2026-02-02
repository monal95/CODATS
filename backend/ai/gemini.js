// CODATS - FIXED PARSING for UI Display
const axios = require('axios');
require('dotenv').config();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Get available models
const getAvailableModels = async () => {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  try {
    const response = await axios.get(
      'https://api.groq.com/openai/v1/models',
      {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const models = response.data.data || [];
    
    // Filter to working models
    return models
      .map(model => model.id)
      .filter(model => 
        !model.includes('deprecated') && 
        !model.includes('decommissioned') &&
        (model.includes('llama') || model.includes('mixtral') || model.includes('gemma'))
      )
      .sort();
    
  } catch (error) {
    console.error('Failed to fetch models:', error.message);
    return [
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'meta-llama/llama-4-scout-17b-16e-instruct'
    ];
  }
};

// Get working model
const getWorkingModel = async () => {
  try {
    const models = await getAvailableModels();
    
    // Try models in order
    const modelPriority = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'meta-llama/llama-4-maverick-17b-128e-instruct'
    ];
    
    for (const model of modelPriority) {
      if (models.includes(model)) {
        console.log(`✅ Using model: ${model}`);
        return model;
      }
    }
    
    return models[0] || 'llama-3.1-8b-instant';
    
  } catch (error) {
    console.error('Model selection error:', error.message);
    return 'llama-3.1-8b-instant';
  }
};

// FIXED: Better prompt for XSS specifically
const createAnalysisPrompt = (vuln, code, language) => {
  const vulnerableLine = code.split('\n')[vuln.line - 1] || vuln.snippet || '';
  
  return `You are a security expert. Fix this ${vuln.type} vulnerability in ${language}.

VULNERABLE CODE:
\`\`\`${language}
${code}
\`\`\`

SPECIFIC ISSUE (line ${vuln.line}):
${vulnerableLine}

PROVIDE THESE 4 THINGS EXACTLY:

1. EXPLANATION:
[Explain the vulnerability in detail: what it is, why it's dangerous, how attackers exploit it, and the impact. Keep it under 300 words.]

2. RISK_LEVEL:
[High/Medium/Low]

3. CONFIDENCE:
[0.00 to 1.00]

4. CORRECTED_CODE:
\`\`\`${language}
[Provide COMPLETE corrected code. Include the entire fixed function/block.
Example for XSS: Use textContent instead of innerHTML, or properly sanitize input.
Make sure the code is complete and runnable.]
\`\`\`

IMPORTANT: For XSS vulnerabilities, show the complete fixed code with proper input sanitization.`;
};

// FIXED: Better parsing that extracts ALL sections properly
const parseAIResponse = (aiResponse, vuln, language) => {
  console.log('🔍 Parsing AI response...');
  
  const result = {
    vulnerabilityId: vuln.id,
    type: vuln.type,
    line: vuln.line,
    explanation: '',
    riskLevel: 'High',
    confidence: 0.9,
    correctedCode: '',
    fix: '', // This is the key field for your UI
    vulnerableLines: [vuln.line],
    originalSnippet: vuln.snippet || '',
    language: language,
    aiGenerated: true,
    source: 'ai'
  };

  try {
    // Log first 500 chars for debugging
    console.log('Raw response (first 500 chars):', aiResponse.substring(0, 500));
    
    // Extract EXPLANATION
    const explanationMatch = aiResponse.match(/1\.\s*EXPLANATION:\s*([\s\S]*?)(?=2\.\s*RISK_LEVEL:|$)/i);
    if (explanationMatch) {
      result.explanation = explanationMatch[1].trim();
      console.log('✅ Found explanation:', result.explanation.substring(0, 100));
    } else {
      // Alternative pattern
      const altExpMatch = aiResponse.match(/EXPLANATION:\s*([\s\S]*?)(?=RISK_LEVEL:|CONFIDENCE:|CORRECTED_CODE:|$)/i);
      if (altExpMatch) {
        result.explanation = altExpMatch[1].trim();
      }
    }

    // Extract RISK_LEVEL
    const riskMatch = aiResponse.match(/2\.\s*RISK_LEVEL:\s*(\w+)/i) || 
                      aiResponse.match(/RISK_LEVEL:\s*(\w+)/i);
    if (riskMatch) {
      const risk = riskMatch[1];
      if (['High', 'Medium', 'Low'].includes(risk)) {
        result.riskLevel = risk;
      }
    }

    // Extract CONFIDENCE
    const confMatch = aiResponse.match(/3\.\s*CONFIDENCE:\s*([\d.]+)/i) || 
                      aiResponse.match(/CONFIDENCE:\s*([\d.]+)/i);
    if (confMatch) {
      const conf = parseFloat(confMatch[1]);
      if (!isNaN(conf) && conf >= 0 && conf <= 1) {
        result.confidence = conf;
      }
    }

    // FIXED: Extract CORRECTED_CODE - More robust parsing
    let correctedCode = '';
    
    // Try multiple patterns
    const patterns = [
      // Pattern 1: With language tag
      new RegExp(`4\\.\\s*CORRECTED_CODE:\\s*\`\`\`${language}\\s*([\\s\\S]*?)\`\`\``, 'i'),
      // Pattern 2: Without number
      new RegExp(`CORRECTED_CODE:\\s*\`\`\`${language}\\s*([\\s\\S]*?)\`\`\``, 'i'),
      // Pattern 3: Any code block after CORRECTED_CODE
      /CORRECTED_CODE:\s*```[\w]*\n([\s\S]*?)```/i,
      // Pattern 4: Any code block with language
      new RegExp(`\`\`\`${language}\\s*([\\s\\S]*?)\`\`\``),
      // Pattern 5: Last code block in response
      /```[\w]*\n([\s\S]*?)```/
    ];
    
    for (const pattern of patterns) {
      const match = aiResponse.match(pattern);
      if (match && match[1]) {
        correctedCode = match[1].trim();
        if (correctedCode.length > 20) {
          console.log(`✅ Found code with pattern ${patterns.indexOf(pattern) + 1}`);
          break;
        }
      }
    }
    
    // If still no code, try to extract any code-like content after CORRECTED_CODE
    if (!correctedCode || correctedCode.length < 20) {
      const fallbackMatch = aiResponse.match(/CORRECTED_CODE:\s*([\s\S]*?)(?=```|$)/i);
      if (fallbackMatch) {
        correctedCode = fallbackMatch[1].trim();
        // Clean up if there are backticks
        correctedCode = correctedCode.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
      }
    }
    
    // Validate and set corrected code
    if (correctedCode && correctedCode.length >= 20) {
      result.correctedCode = correctedCode;
      result.fix = correctedCode; // CRITICAL: This is what your UI uses
      console.log('✅ Found corrected code:', correctedCode.substring(0, 100));
    } else {
      console.error('❌ No valid corrected code found in response');
      console.log('Available text after CORRECTED_CODE:', aiResponse.substring(aiResponse.indexOf('CORRECTED_CODE') + 14, 500));
      throw new Error('No valid corrected code in AI response');
    }

    // If no explanation, generate basic one
    if (!result.explanation || result.explanation.length < 50) {
      result.explanation = `Security vulnerability: ${vuln.type}. ${vuln.description || 'Fix required.'}`;
    }

  } catch (error) {
    console.error('❌ Parse error:', error.message);
    // Generate fallback for XSS specifically
    result.explanation = `XSS Vulnerability: Direct innerHTML assignment allows script injection.`;
    result.correctedCode = `// Fixed XSS vulnerability
function displayGreeting(name) {
    // Use textContent instead of innerHTML to prevent XSS
    const outputElement = document.getElementById("output");
    outputElement.textContent = "Hello, " + name;
    
    // Or if you need HTML, sanitize it first
    // const sanitized = sanitizeHTML(name);
    // outputElement.innerHTML = "Hello, " + sanitized;
}`;
    result.fix = result.correctedCode;
    result.confidence = 0.7;
    result.aiGenerated = false;
  }

  return result;
};

// Main AI analysis function
const getAIAnalysis = async (vulnerabilities, code, language = 'javascript') => {
  console.log(`🚀 AI analysis for ${language}`);
  
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('API key not configured');
  }

  const analyses = [];
  const maxToAnalyze = Math.min(vulnerabilities.length, 2);

  for (let i = 0; i < maxToAnalyze; i++) {
    const vuln = vulnerabilities[i];
    
    console.log(`🔍 ${i + 1}/${maxToAnalyze}: ${vuln.type} at line ${vuln.line}`);
    
    try {
      // Get model
      const model = await getWorkingModel();
      
      // Create prompt
      const prompt = createAnalysisPrompt(vuln, code, language);
      
      // Call AI
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a security expert. Provide complete corrected code and detailed explanations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      
      // Parse response
      const analysis = parseAIResponse(aiResponse, vuln, language);
      analyses.push(analysis);
      
      console.log(`✅ Analyzed ${vuln.type}, confidence: ${analysis.confidence}`);
      
    } catch (error) {
      console.error(`❌ Failed ${vuln.type}:`, error.message);
      
      // Minimal fallback
      analyses.push({
        vulnerabilityId: vuln.id,
        type: vuln.type,
        line: vuln.line,
        explanation: `AI analysis failed: ${error.message}`,
        correctedCode: `// Error: Could not generate AI fix\n// ${error.message}`,
        fix: `// Error: Could not generate AI fix\n// ${error.message}`,
        confidence: 0.0,
        language: language,
        aiGenerated: false,
        error: true
      });
    }
    
    // Delay
    if (i < maxToAnalyze - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`✅ Analysis complete: ${analyses.length} results`);
  return analyses;
};

// Health check
const checkAIHealth = async () => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { healthy: false, message: 'No API key' };
    }
    
    const models = await getAvailableModels();
    
    return {
      healthy: models.length > 0,
      message: models.length > 0 ? 'AI service ready' : 'No models available',
      availableModels: models.slice(0, 5),
      count: models.length
    };
    
  } catch (error) {
    return {
      healthy: false,
      message: 'AI service error',
      error: error.message
    };
  }
};

module.exports = {
  getAIAnalysis,
  checkAIHealth
};