# Interview handbook — draft answers to personalize

Use these as starting points. Keep the final answers truthful to your own experience and adjust them to match the exact questions in the handbook.

## What is Caprae Capital's mission?

My understanding is that Caprae Capital focuses on acquiring and growing businesses, with an emphasis on operational improvement and long-term value creation. I see technology as a practical way to improve how opportunities are sourced, assessed, and managed. I would want to confirm the firm's current priorities directly from its official materials and connect my work to those priorities.

## Why Caprae Capital?

I am interested in building software that solves business problems rather than building features without a clear user outcome. This assignment is a good example: acquisition teams need a way to organize potential targets, identify incomplete information, and prioritize research transparently. My full-stack experience with React, Node.js, APIs, and SQL gives me a foundation to build and iterate on tools like this. I would value the opportunity to learn from a team that combines technology and business execution.

## How could changing ETA / PE benefit from technology?

I interpret ETA as entrepreneurship through acquisition and PE as private equity. In both settings, teams can benefit from tools that reduce repetitive research, make assumptions visible, and help people spend more time on diligence and operating decisions. A sourcing tool should not pretend that a score replaces judgment; it should organize evidence, surface data gaps, and help the team decide what to investigate next.

## What this prototype demonstrates

LeadIQ deduplicates records by normalized company name, calculates a transparent preliminary fit score, flags missing websites and unverified records, supports search and industry filtering, allows CSV export, and persists additions to a local JSON data file. The demo records are synthetic. The scoring is illustrative and is not investment advice.

## Limitations and next steps

For a production version, I would use a relational database such as MySQL, schema migrations, authentication and role-based access, a vetted data provider, source URLs and timestamps for every claim, audit logs, tests, monitoring, and a review process for scoring changes. I would validate whether the scoring criteria match the investment team's actual thesis before using the score in a live workflow.
