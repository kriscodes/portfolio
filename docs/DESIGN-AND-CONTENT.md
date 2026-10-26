# kristiansalmeron.com — Complete v1 design and content strategy

Historical design record for the earlier editorial homepage. The current homepage is [Corner Studio](CORNER-STUDIO.md); case-study evidence and readable routes described here remain part of the portfolio.

## The idea

**Good systems. Wild places.**

An engineer’s field guide, with the confidence of an architecture journal and the wear of an expedition notebook. It should feel like someone who notices things, makes decisions carefully, and actually gets outside.

Positioning: engineering leadership and architecture. Those are the roles the site should help Kristian pursue, not unverified claims about his current job title. A recruiter should remember both the person and one specific piece of engineering judgment.

The visual concept has award-level ambition. An award is an external judgment, not a promise. What can make this distinctive is the combination of original personal photography, coherent art direction, precise engineering evidence, and beautifully executed interactions. The personal Instagram photographs, resume-grounded Gen UI case study, and leadership examples now supply this evidence. Higher-resolution originals and approved supporting artifacts would deepen it.

## Who this is for

1. An engineering recruiter with a minute: understand the focus, inspect one credible project, find contact.
2. A hiring manager with five minutes: see the constraints, boundaries, alternatives, consequences, and current implementation.
3. A future collaborator: recognize care, clear thinking, and a person they would want to work with.

A quick reading path is Home → Care IQ → Contact. A deeper path is Work → request walkthrough → tradeoff ledger → engineering note → About.

## Pages and their exact jobs

| Route                                       | Page                          | Content and job                                                                                     | Main action                               |
| ------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `/`                                         | Home                          | Establish engineering direction and personality, prove the claim with Care IQ, invite a deeper look | Explore my work                           |
| `/work/`                                    | Selected work                 | Gen UI professional impact, Care IQ architecture, and this website                                  | Open Gen UI                               |
| `/work/gen-ui/`                             | Performance field report      | PDF delivery architecture, personal contribution, shared adoption, initial-rendering outcome        | Read the architecture; explore leadership |
| `/work/care-iq/`                            | Architecture field report     | Context, constraint, request path, tradeoffs, implemented scope, technical stack                    | Trace a request; start a conversation     |
| `/about/`                                   | The person behind the systems | Working principles, hiking/sailing/photography, personal Instagram                                  | Explore the interests; inspect the work   |
| `/field-notes/`                             | Open notebook                 | Two focused essays demonstrating thought, not a generic blog feed                                   | Read a note                               |
| `/field-notes/the-boundary-is-the-feature/` | Engineering essay             | Identity, practice resolution, transaction-local context, relationship integrity                    | Explore the working example               |
| `/field-notes/leave-room-for-the-unknown/`  | Perspective essay             | A complete first path, deliberate complexity, decision records, attention                           | Explore the working example               |
| `/contact/`                                 | Make contact                  | A useful prompt for an initial conversation, LinkedIn, Instagram, copy website                      | Connect on LinkedIn                       |
| Unmatched path                              | Custom 404                    | “A little off course.” Recovery without a dead end                                                  | Back to base camp                         |

Do not add a resume button until a verified resume exists. Do not add a photo archive until original images and captions exist. The v1 About page already has a place for that personality without pretending reference imagery is personal work.

## Homepage: exact section sequence and copy

### 1. Masthead

Wordmark: **KRISTIAN SALMERON** with a compact `ks` mark and orange asterisk.
Navigation: **Work · About · Field notes · Let’s talk ↗**.
The header has one clear contact action. Mobile uses a plain “Explore +” menu, with explicit open/close state.

### 2. Hero

Eyebrow: **ENGINEERING / ARCHITECTURE / EXPLORATION**

Headline: **Good systems. Wild places.**

Experience line: **12+ years in software. Still curious.**

Introduction: **I’m Kristian. I build software with clear boundaries, practical architecture, and room to grow.**

Supporting copy: **Complex problems. Clear direction. A little dirt on my shoes.**

Primary action: **Explore my work ↓** → `#selected-work`.
Secondary action: **Try the wind study ↗** → `#field-instrument`.

Handwritten annotation: **Always take the scenic route.**

Image annotation: **FIELD STUDY / OFF THE CLOCK**
Mountain caption: **01 / A LITTLE FURTHER OUT**
Sailing caption: **Chasing the horizon.**
Stamp: **BUILT TO EXPLORE / LAND & SEA**

The first screen communicates engineering immediately. Outdoors imagery supplies identity without displacing the work. The forest road and sailing snapshot now come from @capt_kris. A compact “From my Instagram” link credits the account.

### 3. Index strip

**A FIELD GUIDE TO WHAT I BUILD & HOW I THINK**

Sticky chapter links: **01 / Work · 02 / Notes · 03 / Outside**. Desktop also includes **Let’s talk ↗**. The active chapter follows scrolling; every link is a working native anchor. The compact mobile index keeps all three chapters visible.

### 4. Selected work

Label: **01 / SELECTED WORK**
Headline: **Built for the real world.**

Featured professional project: **NLP Gen UI — Medical documents, ready in seconds.** At Highmark Health, Kristian re-architected PDF delivery and rendering and built the shared capability for five enterprise applications. Display the resume’s initial-rendering metric **~15 minutes → <5 seconds**, with **1,500+ medical coders** and **5 enterprise applications** as context. Link **Read the performance story ↗** to `/work/gen-ui/`. Care IQ follows as the independent project.
Project: **Care IQ**
Project thesis: **Trust starts at the boundary.**
Description: **Designing tenant isolation into the first patient and appointment workflows of a healthcare platform.**
Tags: **Next.js · Express · PostgreSQL**
Action: **Open the field report ↗**

The diagram introduces identity → practice context → patient and appointment data. The diagram links directly to the interactive request explanation, while the project title and field-report link open the complete case study. It is an architecture illustration, never a fabricated product screenshot.

### 5. Field notes

Label: **02 / FIELD NOTES**
Headline: **Things worth thinking through.**

- **001 / ENGINEERING — The boundary is the feature.** Subtitle on its article page: **Why practice context belongs inside the transaction.**
- **002 / PERSPECTIVE — Leave room for the unknown.** Subtitle: **A direction can be clear without pretending the whole route is known.**

Each note contains complete starter prose. No fabricated publication dates, popularity, or reading statistics.

### 6. Personal perspective

Label: **03 / THE PERSON BEHIND THE SYSTEMS**
Headline: **Curiosity doesn’t clock out.**

**A trail changes your perspective. Sailing makes you pay attention. Photography makes you look again.**

**I want to bring that same care to software: understand the terrain, make a clear decision, and leave things better than I found them.**

Action: **A little more about me ↗**

Index: **01 / BOOTS ON THE GROUND · 02 / EYES ON THE HORIZON · 03 / ONE MORE FRAME**

This is proposed first-person editorial copy grounded in the hobbies Kristian supplied, not a claim about particular trips or leadership outcomes.

The Wind Study follows within this section: **WIND STUDY / 001**, **BUILT FOR CURIOSITY**, **Go with your own flow.** Supporting copy: **Change the direction. Stir up an eddy. See what follows.** Controls: **Flow direction**, **Drift / Breeze / Gust**, **Pause motion / Play motion**, **Reset**, and **Under the surface**.

### 7. Contact signal

Eyebrow: **THE NEXT GOOD THING STARTS WITH A CONVERSATION.**
Headline/action: **Let’s build something that matters. ↗**

Supporting strip: **ENGINEERING · ARCHITECTURE · A SHARED SENSE OF CURIOSITY**
Closing annotation: **END OF PAGE. START OF SOMETHING.**

The orange panel gives the end of the page a strong, memorable silhouette.

### 8. Footer

**Kristian Salmeron ✳**
**BUILT WITH INTENT. BEST VIEWED WITH CURIOSITY.**
Current year, **EST. ON EARTH**, and **Back to the surface ↑**.

## The memorable UI components

### The expedition prints

A full-size redwood-road print and a smaller sailing snapshot overlap at opposing angles. Paper edges, restrained shadows, a translucent tape fragment, and a circular equipment stamp make the composition feel handled. Hover settles the prints slightly. No drag gesture is required to read anything. Mobile keeps the complete composition in a single column. Reduced-motion settings preserve the resting state.

The emotional memory: this engineer has a life beyond the keyboard. The current images are personal Instagram renditions showing a redwood road, a candid sailing moment, and an aerial city view. Avoid a glossy stock-adventure aesthetic in the final personal edit.

### The Wind Study

A custom Canvas field draws hundreds of fine, ink-colored trails around an eddy. Move across the chart, tap a position, or focus the chart and use arrow keys. Adjust the bearing and strength; the compass and flow respond together. The interaction lives with the sailing-inspired personal section, and the hero gives curious visitors a direct shortcut.

Warm paper, restrained ink, map lines, and a small compass make the component feel like a field instrument. Its purpose is to make frontend craft visible through direct manipulation. An optional “Under the surface” disclosure explains the implementation. This is an expressive flow study, not a forecast or scientifically calibrated sailing tool.

Pause produces a still streamline drawing that continues to respond to the controls. Reduced motion uses the same still mode. Animation rests outside the viewport and when the browser tab is hidden. Native controls, keyboard input, modest particle limits, and no added runtime dependency are part of the craft.

### Follow one request

Five selectable stages: **Establish identity → Resolve the practice → Set transaction context → Apply the data boundary → Keep relationships local**.

Each stage shows the responsible layer, a concise explanation, a technical annotation, and an expandable question a hiring manager might ask. The final stage explains the composite foreign key. “Next stage” is optional; every stage is directly selectable. State changes are announced to assistive technology. On mobile the stage controls form a horizontal rail with the detail beneath.

The intellectual memory: Kristian can explain where trust lives in a system. It is an interactive teaching instrument, not ornamental animation or a live security simulator.

### The decision ledger

Expandable rows for a separate API, database-enforced isolation, and a complete first workflow. Every row pairs **What it gives** with **What it asks**. The first opens by default. Native disclosure controls work with the keyboard and without animation.

The leadership memory: choices have costs, and this engineer names them.

### Land / sea / lens

An interest selector changes the photograph, caption, and short perspective together. Clicking the image opens a native modal with a close button, Escape support, and contained focus. It creates a small discovery moment without hiding biography behind a game.

The personal memory: a consistent kind of curiosity across code and life.

### The open notebook

Oversized printed issue numbers, dashed borders, and long-form typography turn two thoughtful essays into a tactile reading destination. No fake terminal, endless marquee, custom cursor, forced intro, or scroll hijack is needed.

## Visual system

| Token         | Value     | Use                                            |
| ------------- | --------- | ---------------------------------------------- |
| Paper         | `#f2f0e6` | Main background; warm enough to feel physical  |
| Evergreen ink | `#193e33` | Headings, body, boundaries, primary actions    |
| Signal orange | `#b13c21` | Editorial emphasis, index marks, contact panel |
| Soft terrain  | `#e4e6d9` | Diagrams, supporting surfaces                  |
| Muted ink     | `#60685d` | Secondary copy                                 |
| Rule          | `#c9cbbd` | Fine separations                               |

Typography: system grotesk for assertive headings, Georgia italics for movement and humanity, Courier for map-like indexing. System fonts avoid another network dependency. Large headlines must preserve readable letter spacing at every viewport.

Texture is a low-opacity noise layer over the paper, never noise behind individual letters. Edges are mostly square; round forms are reserved for index circles and stamps. Imagery is muted slightly while retaining sun and sky. There is no dark theme in this direction.

Most motion is brief and tied to direct interaction. The Wind Study animates while visible, with an explicit pause control and a responsive still mode for reduced motion. There is no page-wide custom cursor; the chart uses the native crosshair. Content and navigation remain available when reduced motion is requested.

## Content rules for the next pass

Lead each case study with a constraint, then show Kristian’s exact contribution, decisions, artifacts, and verified outcomes. A diagram, ADR excerpt, anonymized screenshot, or test result is evidence; a list of buzzwords is not.

For every future project capture: context; dates; personal role; collaborators; constraints; alternatives; decision; implementation evidence; what changed; measurement method; what remains unresolved; permission to publish. Distinguish individual work from team results.

Publish one useful field note when there is something concrete to explain. Initial backlog: the database role/RLS interaction, negative-path testing for tenant isolation, documenting a decision that changed, and a personal photo essay with original captions. These are proposed topics, not claims of completed work.

Keep the tone direct, thoughtful, and lightly playful. Outdoor metaphors should add character; engineering explanations should stay literal. Avoid “visionary,” “10x,” “rockstar,” skill percentages, invented testimonials, and availability badges that are not maintained.

## What would take it from strong v1 to award submission

1. Upgrade the personal Instagram renditions to camera originals when available, preserving authentic light and imperfections.
2. Add approved supporting artifacts or measurement methodology to the resume-grounded Gen UI case study.
3. Have Kristian edit the first-person copy so its rhythm sounds unmistakably like him.
4. Audit keyboard flow, contrast, reduced motion, mobile reading, and real-device performance. Aim for Core Web Vitals targets, but only report measured results.
5. Test the recruiter journey: after one minute, can a reader describe a real decision and find a contact path?

Keep the public site focused. The more specific the proof and photography become, the less spectacle it needs.

## Leadership evidence on About

Place **Leadership in practice — Make the work work better.** before the working principles. Establish the Highmark Health Lead Software Engineer role, then present three concise stories: One ClaimHub’s eight-application / 10+ team consolidation; technical delivery across five initiatives and approximately 25 contributors alongside standards and documentation; and technical leadership and mentoring of three frontend engineers at CrossComm while approximately 80% hands-on. Use the exact scope established by the resume and the “Find Open Jobs” clarification. Link to the Gen UI field report.
