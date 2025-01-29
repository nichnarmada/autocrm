# Agent System Test Cases

## Phase 2.1: Classifier & Research Agent Tests

### Classifier Agent Test Cases

1. **Critical Bug Classification**

   ```typescript
   {
     input: {
       id: "test-1",
       title: "Database connection fails after 1000 concurrent users",
       description: "In production, the app crashes when we hit 1000+ concurrent users. Steps:\n1. Load test with 1000 users\n2. Monitor database connections\n3. System throws connection pool errors\n4. All users get 500 errors\nThis is urgent as it affects our scaling capability."
     },
     expectedOutput: {
       category: "bug",
       confidence: ">= 0.9",
       requiresResearch: true,
       reasoning: {
         mustInclude: ["concurrent", "connection", "crash"]
       },
       classificationTimestamp: expect.any(String)
     }
   }
   ```

2. **Feature Request Classification**

   ```typescript
   {
     input: {
       id: "test-2",
       title: "Add bulk export functionality for reports",
       description: "Our enterprise customers need the ability to export multiple reports at once. Currently, they have to export each report individually, which is time-consuming when dealing with 50+ reports. This would save them several hours per week."
     },
     expectedOutput: {
       category: "feature_request",
       confidence: ">= 0.8",
       requiresResearch: false,
       reasoning: {
         mustInclude: ["new functionality", "export", "bulk"]
       },
       classificationTimestamp: expect.any(String)
     }
   }
   ```

3. **Support Request Classification**

   ```typescript
   {
     input: {
       id: "test-3",
       title: "How to configure webhook notifications",
       description: "Need help setting up webhook notifications for our integration. I've read the documentation but still getting 401 errors. Using API version 2.1, following the setup guide, but notifications aren't coming through."
     },
     expectedOutput: {
       category: "support",
       confidence: ">= 0.8",
       requiresResearch: false,
       reasoning: {
         mustInclude: ["setup", "configuration", "help"]
       },
       classificationTimestamp: expect.any(String)
     }
   }
   ```

4. **Documentation Update Request**

   ```typescript
   {
     input: {
       id: "test-4",
       title: "API documentation is outdated for v2.1",
       description: "The authentication section in the API docs still shows examples for v2.0, but we're on v2.1 now. The token format has changed, but this isn't reflected in the examples. This is causing confusion for new integrations."
     },
     expectedOutput: {
       category: "documentation",
       confidence: ">= 0.8",
       requiresResearch: false,
       reasoning: {
         mustInclude: ["outdated", "documentation", "examples"]
       },
       classificationTimestamp: expect.any(String)
     }
   }
   ```

5. **Performance Enhancement Request**
   ```typescript
   {
     input: {
       id: "test-5",
       title: "Improve search filter performance",
       description: "The search filters on the dashboard are slow when there are more than 1000 results. Request to optimize the filter operations. Currently takes 5-6 seconds to apply a filter, would be great if this could be under 1 second."
     },
     expectedOutput: {
       category: "enhancement",
       confidence: ">= 0.8",
       requiresResearch: true,
       reasoning: {
         mustInclude: ["performance", "optimize", "slow"]
       },
       classificationTimestamp: expect.any(String)
     }
   }
   ```

### Test Validation Rules

1. **Response Format**

   - All responses must include: category, confidence, reasoning, requiresResearch, classificationTimestamp
   - Category must be one of the valid types
   - Confidence must be between 0 and 1
   - Reasoning must be a non-empty string
   - RequiresResearch must be a boolean

2. **Confidence Thresholds**

   - High confidence (>= 0.9) for clear cases (bugs with steps, feature requests with clear business value)
   - Medium confidence (>= 0.8) for standard cases
   - Lower confidence (>= 0.6) for ambiguous cases

3. **Performance Requirements**

   - Classification should complete within 3 seconds
   - Batch classification (10 tickets) should complete within 10 seconds

4. **Error Handling**
   - Should handle missing or incomplete input gracefully
   - Should validate category against allowed values
   - Should provide meaningful error messages

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
