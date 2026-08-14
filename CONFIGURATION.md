# HireMind AI — Dynamic Configuration Reference

HireMind AI features real-time, zero-rebuild dynamic configuration stored in the database.

## Config Properties

| Field | Type | Default | Description |
|---|---|---|---|
| `brandName` | String | `HireMind AI` | Application name shown in header and titles |
| `brandTagline` | String | `Evidence-based job readiness...` | Subtitle shown in hero |
| `accentColor` | Enum | `blue` | Options: `blue`, `indigo`, `violet`, `emerald`, `amber`, `rose` |
| `defaultDifficulty` | Enum | `auto` | Default interview mode: `auto`, `easy`, `medium`, `hard` |
| `scoringWeights` | Object | See below | 4-factor Match Index weights (must sum to 1.0) |
| `readinessWeights`| Object | See below | 5-factor Readiness Index weights (must sum to 1.0) |
| `featureFlags` | Object | See below | Runtime toggles for features |

### Scoring Weights Default
```json
{
  "requiredSkillAlignment": 0.40,
  "evidenceStrength": 0.30,
  "semanticRelevance": 0.20,
  "coverageBreadth": 0.10
}
```

### Readiness Weights Default
```json
{
  "jobAlignment": 0.30,
  "requiredCoverage": 0.25,
  "interviewEvidence": 0.20,
  "technicalReadiness": 0.15,
  "communication": 0.10
}
```

### Feature Flags Default
```json
{
  "enableVoiceInput": true,
  "enablePresentationMode": true,
  "enableCompareView": true,
  "enableAchievements": true,
  "enableDemoMode": true,
  "enableAIPolish": true
}
```
