#!/usr/bin/env node

/**
 * Requirement Analysis Skill
 * 
 * Parses a PRD markdown file and extracts structured requirements into JSON.
 * 
 * Usage: node requirement-analysis.js <prd-path> [output-path]
 * 
 * Example: node requirement-analysis.js test-prd.md requirements.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const prdPath = process.argv[2];
const outputPath = process.argv[3] || 'requirements.json';

if (!prdPath) {
  console.error('Error: PRD path is required');
  console.error('Usage: node requirement-analysis.js <prd-path> [output-path]');
  process.exit(1);
}

// Read PRD file
if (!fs.existsSync(prdPath)) {
  console.error(`Error: File not found: ${prdPath}`);
  process.exit(1);
}

const prdContent = fs.readFileSync(prdPath, 'utf-8');

// Parse markdown structure
function parsePRD(content) {
  const lines = content.split('\n');
  const result = {
    project: {
      name: '',
      description: ''
    },
    features: []
  };

  let currentFeature = null;
  let currentSection = null; // 'requirements' or 'acceptance_criteria'
  let featureCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Extract project name from H1
    if (line.startsWith('# ') && !result.project.name) {
      result.project.name = line.substring(2).trim();
      // Next non-empty line is description
      for (let j = i + 1; j < lines.length; j++) {
        const descLine = lines[j].trim();
        if (descLine && !descLine.startsWith('#')) {
          result.project.description = descLine;
          break;
        }
      }
    }

    // Extract features from H2
    if (line.startsWith('## ')) {
      featureCount++;
      currentFeature = {
        id: `F-${String(featureCount).padStart(3, '0')}`,
        name: line.substring(3).trim(),
        description: '',
        requirements: [],
        acceptance_criteria: [],
        priority: 'P1' // Default priority
      };
      result.features.push(currentFeature);
      currentSection = null;

      // Next non-empty line is description
      for (let j = i + 1; j < lines.length; j++) {
        const descLine = lines[j].trim();
        if (descLine && !descLine.startsWith('#') && !descLine.startsWith('-')) {
          currentFeature.description = descLine;
          break;
        }
      }
    }

    // Detect section headers
    if (line.startsWith('### Requirements')) {
      currentSection = 'requirements';
      continue;
    }
    if (line.startsWith('### Acceptance Criteria')) {
      currentSection = 'acceptance_criteria';
      continue;
    }

    // Extract requirements and acceptance criteria from bullet points
    if (currentFeature && line.startsWith('- ')) {
      const item = line.substring(2).trim();
      
      if (currentSection === 'requirements') {
        currentFeature.requirements.push(item);
        
        // Determine priority based on keywords
        const lowerItem = item.toLowerCase();
        if (lowerItem.includes('must') || lowerItem.includes('required') || 
            lowerItem.includes('critical') || lowerItem.includes('essential')) {
          currentFeature.priority = 'P0';
        } else if (lowerItem.includes('could') || lowerItem.includes('nice-to-have') || 
                   lowerItem.includes('optional')) {
          if (currentFeature.priority !== 'P0') {
            currentFeature.priority = 'P2';
          }
        }
      } else if (currentSection === 'acceptance_criteria') {
        currentFeature.acceptance_criteria.push(item);
      }
    }
  }

  return result;
}

// Parse and validate
const requirements = parsePRD(prdContent);

if (requirements.features.length === 0) {
  console.error('Error: No features found in PRD');
  console.error('Make sure your PRD has H2 headings (## Feature Name) for each feature');
  process.exit(1);
}

// Validate each feature has requirements
for (const feature of requirements.features) {
  if (feature.requirements.length === 0) {
    console.warn(`Warning: Feature "${feature.name}" has no requirements`);
  }
}

// Write output
fs.writeFileSync(outputPath, JSON.stringify(requirements, null, 2));

console.log(`✓ Parsed ${requirements.features.length} features from ${prdPath}`);
console.log(`✓ Output written to ${outputPath}`);
console.log('');
console.log('Features:');
requirements.features.forEach(f => {
  console.log(`  ${f.id}: ${f.name} (${f.priority})`);
  console.log(`    - ${f.requirements.length} requirements`);
  console.log(`    - ${f.acceptance_criteria.length} acceptance criteria`);
});
