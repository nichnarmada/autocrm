import { ChatOpenAI } from "@langchain/openai"
import { MemorySaver } from "@langchain/langgraph"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { ClassifierInput, ClassifierResult } from "@/types/agents/classifier"
import { classificationPrompt, defaultClassifierConfig } from "./config"
import { TicketCategory } from "@/types/tickets"

// 1. Create the agent
const agentModel = new ChatOpenAI(defaultClassifierConfig)
const agentCheckpointer = new MemorySaver()
const classifierAgent = createReactAgent({
  llm: agentModel,
  tools: [],
  checkpointSaver: agentCheckpointer,
})

export async function classifyTicket(
  input: ClassifierInput
): Promise<ClassifierResult> {
  // Add input validation
  if (!input.title?.trim() || !input.description?.trim()) {
    throw new Error("Title and description are required")
  }
  console.log("Input:", input)

  const promptMessages = await classificationPrompt.formatMessages({
    title: input.title,
    description: input.description,
  })

  const finalState = await classifierAgent.invoke(
    { messages: promptMessages },
    {
      configurable: {
        thread_id: `ticket-${input.id}-${Date.now()}`,
      },
    }
  )

  const lastMessage =
    finalState.messages[finalState.messages.length - 1].content

  let parsed: ClassifierResult
  try {
    const messageStr =
      typeof lastMessage === "string"
        ? lastMessage
        : JSON.stringify(lastMessage)
    parsed = JSON.parse(messageStr)

    // Validate the response
    if (!parsed.category || !parsed.confidence || !parsed.reasoning) {
      throw new Error("Invalid response format")
    }

    // Ensure category is valid
    const validCategories = [
      "bug",
      "feature_request",
      "support",
      "question",
      "documentation",
      "enhancement",
      "other",
    ] as TicketCategory[]

    if (!validCategories.includes(parsed.category)) {
      throw new Error(`Invalid category: ${parsed.category}`)
    }
  } catch (error) {
    console.error("Parsing error:", error)
    throw new Error(`Failed to parse classification JSON: ${error}`)
  }

  return {
    ...parsed,
    classificationTimestamp: new Date().toISOString(),
  }
}
