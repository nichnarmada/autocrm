import { ClassifierConfig } from "@/types/agents/classifier"
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  AIMessagePromptTemplate,
} from "@langchain/core/prompts"

export const defaultClassifierConfig: ClassifierConfig = {
  minConfidenceThreshold: 0.8,
  requireResearchThreshold: 0.7,
  model: "gpt-4-turbo-preview",
  temperature: 0.2,
  maxTokens: 1000,
}

// Define few-shot examples for better classification
const examples = [
  {
    title: "App crashes on PDF upload",
    description: "Application freezes when uploading large PDFs",
    output: {
      category: "bug",
      confidence: 0.95,
      reasoning: "Clear technical malfunction with specific reproduction steps",
      requiresResearch: true,
    },
  },
  {
    title: "Add dark mode support",
    description: "Would love to have dark mode for better night viewing",
    output: {
      category: "feature_request",
      confidence: 0.9,
      reasoning: "New functionality request for UI enhancement",
      requiresResearch: false,
    },
  },
]

// Create a system prompt template
const systemPrompt =
  SystemMessagePromptTemplate.fromTemplate(`You are a ticket classification expert. Your task is to:
1. Analyze the ticket's title and description
2. Classify it into one of these categories:
   - bug: Technical issues, errors, or malfunctions
   - feature_request: New feature suggestions or enhancements
   - support: Help with existing features or usage
   - question: General inquiries about functionality
   - documentation: Documentation-related requests
   - enhancement: Improvements to existing features
   - other: Anything that doesn't fit above categories

You must respond ONLY with a JSON object in this format:
{{
  "category": string,
  "confidence": number,
  "reasoning": string,
  "requiresResearch": boolean
}}

Important:
- category must be one of the exact values listed above
- confidence should be between 0 and 1
- provide clear reasoning for your classification
- requiresResearch should be true if similar issues need to be investigated`)

// Build prompt templates for each example so that placeholders are replaced at formatting time
const examplePrompts = examples.flatMap((ex) => [
  // Turn the example’s Title/Description into a human message
  HumanMessagePromptTemplate.fromTemplate(
    `Title: ${ex.title}\nDescription: ${ex.description}`
  ),
  // Turn the example’s output into an AI message (JSON formatted)
  AIMessagePromptTemplate.fromTemplate(JSON.stringify(ex.output, null, 2)),
])

// Create a final user (human) prompt template with placeholders
const userPrompt = HumanMessagePromptTemplate.fromTemplate(
  `Title: {title}\nDescription: {description}`
)

// Create the chat prompt template with examples
export const classificationPrompt = ChatPromptTemplate.fromMessages([
  systemPrompt,
  // ...examplePrompts,
  userPrompt,
])
