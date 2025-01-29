# Agent System Test Cases

## Phase 2.1: Classifier & Research Agent Tests

### Classifier Agent Test Cases

1. **Basic Classification**

   ```typescript
   {
     input: {
       title: "Cannot log in to application",
       description: "Getting 500 error when attempting to log in"
     },
     expectedOutput: {
       category: "bug",
       confidence: ">= 0.8",
       requiresResearch: true
     }
   }
   ```

2. **Feature Request Classification**

   ```typescript
   {
     input: {
       title: "Add dark mode support",
       description: "Would be great to have dark mode for better visibility at night"
     },
     expectedOutput: {
       category: "feature_request",
       confidence: ">= 0.9",
       requiresResearch: true
     }
   }
   ```

3. **Ambiguous Case**

   ```typescript
   {
     input: {
       title: "Dashboard loading slow",
       description: "Dashboard takes too long to load. Can we improve it or add a loading indicator?"
     },
     expectedOutput: {
       category: ["bug", "enhancement"], // Either is acceptable
       confidence: "< 0.8", // Should have lower confidence due to ambiguity
       requiresResearch: true
     }
   }
   ```

### Research Agent Test Cases

1. **Similar Bug Investigation**

   ```typescript
   {
     input: {
       ticketId: "ticket-123",
       category: "bug",
       searchTerms: ["login", "500 error"]
     },
     expectedOutput: {
       similarTickets: [
         {
           id: "any",
           minCount: 2,
           maxCount: 5,
           mustInclude: ["resolution", "rootCause"]
         }
       ],
       patterns: {
         required: ["frequency", "impact", "commonFixes"]
       }
     }
   }
   ```

2. **Feature Request Research**

   ```typescript
   {
     input: {
       ticketId: "ticket-456",
       category: "feature_request",
       searchTerms: ["dark mode", "theme"]
     },
     expectedOutput: {
       similarRequests: {
         minCount: 1,
         mustInclude: ["demand_level", "implementation_complexity"]
       },
       existingWork: {
         required: ["related_features", "planned_work"]
       }
     }
   }
   ```

## Phase 2.2: Priority & SLA Agent Tests

1. **High Priority Bug**

   ```typescript
   {
     input: {
       classification: {
         category: "bug",
         confidence: 0.9
       },
       research: {
         similarTickets: 5,
         averageResolutionTime: "2 hours",
         impactLevel: "high"
       }
     },
     expectedOutput: {
       priority: "high",
       sla: {
         responseTime: "<= 1 hour",
         resolutionTime: "<= 4 hours"
       },
       confidence: ">= 0.8"
     }
   }
   ```

2. **Low Priority Enhancement**

   ```typescript
   {
     input: {
       classification: {
         category: "enhancement",
         confidence: 0.85
       },
       research: {
         similarTickets: 2,
         averageResolutionTime: "5 days",
         impactLevel: "low"
       }
     },
     expectedOutput: {
       priority: "low",
       sla: {
         responseTime: "<= 48 hours",
         resolutionTime: "<= 7 days"
       },
       confidence: ">= 0.7"
     }
   }
   ```

## Phase 2.3: Routing Agent Tests

1. **Technical Bug Assignment**

   ```typescript
   {
     input: {
       ticket: {
         category: "bug",
         priority: "high",
         area: "authentication"
       },
       research: {
         requiredSkills: ["backend", "security"],
         complexity: "high"
       }
     },
     expectedOutput: {
       team: {
         name: "backend-team",
         confidence: ">= 0.8"
       },
       agent: {
         required: ["experience_with_auth", "available_capacity"],
         confidence: ">= 0.7"
       }
     }
   }
   ```

2. **Feature Request Assignment**

   ```typescript
   {
     input: {
       ticket: {
         category: "feature_request",
         priority: "medium",
         area: "ui"
       },
       research: {
         requiredSkills: ["frontend", "ux"],
         complexity: "medium"
       }
     },
     expectedOutput: {
       team: {
         name: "frontend-team",
         confidence: ">= 0.8"
       },
       agent: {
         required: ["ui_experience", "feature_development"],
         confidence: ">= 0.7"
       }
     }
   }
   ```

## Phase 2.4: Integration Tests

1. **End-to-End Processing**

   ```typescript
   {
     input: {
       ticket: {
         title: "App crashes on file upload",
         description: "When uploading files larger than 10MB, the app crashes"
       }
     },
     expectedOutput: {
       classification: {
         category: "bug",
         confidence: ">= 0.8"
       },
       research: {
         similarTickets: ">= 1",
         patterns: "identified"
       },
       priority: {
         level: "high",
         sla: "defined"
       },
       routing: {
         team: "assigned",
         agent: "suggested"
       },
       timing: {
         totalProcessing: "<= 5 seconds"
       }
     }
   }
   ```

2. **Parallel Processing**

   ```typescript
   {
     input: {
       tickets: [
         {
           id: "ticket-1",
           title: "Login issue",
           description: "Cannot log in"
         },
         {
           id: "ticket-2",
           title: "Dark mode request",
           description: "Add dark mode"
         }
       ]
     },
     expectedOutput: {
       processingTime: "<= 8 seconds",
       allTicketsProcessed: true,
       results: {
         minCount: 2,
         allHave: ["classification", "research", "priority", "routing"]
       }
     }
   }
   ```

## Test Evaluation Metrics

### Accuracy Metrics

- Classification accuracy: >= 90%
- Research relevance: >= 85%
- Priority assignment accuracy: >= 85%
- Routing effectiveness: >= 80%

### Performance Metrics

- Single ticket processing: <= 5 seconds
- Batch processing (10 tickets): <= 30 seconds
- Agent coordination overhead: <= 500ms

### Reliability Metrics

- Error rate: <= 5%
- Recovery rate: >= 95%
- Consistency score: >= 90%

## Testing Tools

- LangSmith for agent evaluation
- Jest for integration tests
- K6 for performance testing
- Custom dashboard for metric tracking
