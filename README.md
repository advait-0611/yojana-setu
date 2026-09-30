# योजना सेतु | YOJANA SETU

### AI-Driven Scheme Matching for Marginalized Entrepreneurs

**Government Scheme Discovery • Eligibility Matching • Document Pre-Verification • DPR Generation**

> **Smart India Hackathon 2026 — SIH26092**  
> **Ministry of Social Justice and Empowerment (MoSJE)**

---

## 📌 Project Overview

**Yojana Setu (योजना सेतु)** is a web-based government scheme discovery and eligibility assistance platform designed to help marginalized and aspiring entrepreneurs identify government schemes that may be relevant to their personal and business profiles.

Finding suitable government schemes can be challenging because information is distributed across multiple schemes, departments, eligibility conditions, income requirements, categories, sectors, and documentation requirements.

Yojana Setu simplifies this process by allowing an applicant to enter their profile through a structured questionnaire or voice input. The platform then compares the profile against a structured scheme dataset and produces an explainable list of potentially relevant schemes.

The platform also provides supporting tools for:

- Voice-based profile input
- Rule-based scheme matching
- Explainable eligibility reasons
- Document pre-verification using OCR
- Preliminary Detailed Project Report (DPR) generation
- Scheme-specific document guidance
- Enterprise planning assistance

The project is developed as a **functional prototype for Smart India Hackathon 2026** under problem statement **SIH26092**.

---

## 🎯 Problem Statement

Entrepreneurs from marginalized communities may face several difficulties while searching for and applying to government support schemes.

### Major challenges

- Government schemes are spread across different departments and portals.
- Eligibility criteria can be difficult for applicants to interpret.
- Applicants may not know which schemes are relevant to their profile.
- Category, income, age, education, sector, and enterprise conditions may differ between schemes.
- Applicants may be uncertain about the documents required before starting an application.
- Preparing a structured business/project proposal can be difficult for first-time entrepreneurs.
- Users with limited digital literacy may find conventional information-heavy portals difficult to navigate.

### The core problem

The challenge is not simply finding a list of schemes.

The challenge is helping an applicant answer:

> **"Which government schemes may be relevant to my specific profile and business requirement, and why?"**

Yojana Setu addresses this through structured profile collection, rule-based matching, explainable results, document pre-checking, and preliminary project-document generation.

---

# 💡 Our Solution

Yojana Setu provides a guided workflow:

```text
Applicant Profile
       ↓
Questionnaire / Voice Input
       ↓
Profile Processing
       ↓
Eligibility Matching Engine
       ↓
Relevant Scheme Results
       ↓
Eligibility Reasons
       ↓
Document Pre-Verification
       ↓
Preliminary DPR Generation
       ↓
Applicant Can Proceed to Official Scheme/Application Process

🚀 Key Features
1. Structured Applicant Questionnaire

The platform collects important applicant information through a guided multi-step questionnaire.

The profile can include:

Name
Age
Gender
Social category
Education
Annual income
Location
Business sector
Required capital / loan requirement
New or existing enterprise information

The questionnaire is designed to keep the process simple and understandable.

2. Voice-Based Profile Input

Yojana Setu supports browser-based speech recognition to reduce typing requirements.

Users can provide information through natural spoken phrases such as:

My age is twenty eight years old.
My annual income is two lakh rupees.
I am OBC category.
I need a loan of five lakh rupees.

The system processes recognized speech and attempts to extract relevant profile fields.

Supported voice concepts include
Age
Gender
Social category
Income
Loan/capital requirement
Location
Education
Business sector

The implementation also supports common English, Hindi, and Roman-Hindi number expressions.

Examples include:

two lakh
five lakh rupees
do lakh rupaye
paanch lakh
अट्ठाईस

The interface provides language selection for English and Hindi speech recognition.

3. AI-Assisted / Rule-Based Scheme Matching

The core scheme discovery functionality uses a structured eligibility matching engine.

The current prototype uses a deterministic rule-based approach rather than a black-box machine-learning model.

This approach provides:

Predictable results
Explainable matching
Easier debugging
Transparent eligibility logic
Easy expansion of the scheme dataset

The system evaluates available applicant information against configured scheme eligibility conditions.

Matching factors can include
Age
Social category
Gender
Income
Education
Location
Business sector
Required capital
Enterprise status
Special category requirements
4. Explainable Eligibility Results

Yojana Setu does not only display a scheme name.

The matching API returns a match percentage and supporting reasons.

For example:

Scheme: PMEGP

Match: 85%

Reasons:
✓ Age falls within configured eligibility range
✓ Applicant category is supported
✓ Business sector is supported
✓ Requested project cost is within configured limit

This makes the matching process easier to understand and demonstrate.

5. Government Scheme Dataset

The prototype currently contains a structured dataset of 20 government schemes and support programs.

The dataset is stored locally in:

src/data/schemes.json

The current prototype dataset includes:

Prime Minister's Employment Generation Programme (PMEGP)
Pradhan Mantri Mudra Yojana (PMMY / MUDRA)
Stand-Up India
PM-DAKSH
National SC-ST Hub
PM Formalisation of Micro Food Processing Enterprises (PMFME)
PM Vishwakarma
PM SVANidhi
ASIIM
Venture Capital Fund for Scheduled Castes (VCF-SC)
Credit Enhancement Guarantee Scheme for Scheduled Castes
NSFDC Self Employment / Term Loan Support
NBCFDC Individual Loan Support
NSTFDC Term Loan Scheme
NDFDC Divyangjan Swavalamban Yojana
NSKFDC Self Employment Support
SEED for DNTs
PM-AJAY
SMILE
CGTMSE

The dataset is structured so that additional schemes can be added without changing the overall application architecture.

6. Document Pre-Verification Using OCR

Yojana Setu includes a document pre-verification feature using Tesseract.js.

Users can upload supported document images and the system attempts to extract visible text.

Supported image formats
PNG
JPG
JPEG
WEBP
OCR languages

The prototype supports:

English
Hindi

The system checks for useful information such as:

Name
Address
Income information
Category-related information
Aadhaar/PAN references
Other recognizable document indicators

The system also attempts to infer the document type from the extracted text.

Important

The OCR feature is a pre-checking and assistance mechanism.

It does not verify the authenticity of a government document and does not replace official document verification.

7. Preliminary DPR Generator

Yojana Setu can generate a preliminary Detailed Project Report (DPR) based on the applicant's entered profile and selected scheme.

The generated PDF can contain:

Executive Summary
Applicant Profile
Proposed Enterprise
Project Cost
Means of Finance
Selected Government Scheme
Eligibility Assessment
Sector-Specific Business Plan
Illustrative Financial Snapshot
Implementation Plan
Documents & Next Steps
Declaration
Applicant acknowledgement
Signature/date section

The DPR is formatted as an A4 document and includes page numbering and structured sections.

Financial assumptions

The prototype can generate illustrative planning figures based on the applicant's entered project cost.

These figures are clearly identified as illustrative planning assumptions and are not presented as guaranteed financial forecasts, loan sanctions, or government approvals.

8. Sector-Specific Enterprise Planning

The DPR generator adapts parts of the preliminary business plan according to the selected business sector.

Supported sectors include:

Manufacturing
Services
Trading
Agriculture & Allied Activities

This allows the generated project document to provide more relevant planning content instead of using exactly the same text for every applicant.

9. Scheme-Specific Document Guidance

Each scheme in the structured dataset can contain document requirements.

The system can therefore display information about documents that may be required for a particular scheme.

This helps users understand what information or documentation they may need before proceeding with an official application.

🏗️ System Architecture

The high-level architecture of Yojana Setu is:

                         ┌───────────────────────┐
                         │       Applicant       │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │   Next.js Frontend    │
                         │ React + Tailwind CSS  │
                         └───────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
             Questionnaire      Voice Input       OCR Upload
                    │                │                │
                    │                │                ▼
                    │                │          ┌─────────────┐
                    │                │          │ Tesseract.js│
                    │                │          └──────┬──────┘
                    │                │                 │
                    └────────────────┼─────────────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │ Applicant Profile     │
                         │ Normalization         │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │ Next.js API Route     │
                         │ /api/match             │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │ Matching Engine       │
                         │ Rule-Based Eligibility│
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │ schemes.json          │
                         │ Structured Dataset    │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │ Matched Schemes       │
                         │ + Reasons             │
                         │ + Match Percentage    │
                         └───────────┬───────────┘
                                     │
                        ┌────────────┴────────────┐
                        ▼                         ▼
                Scheme Results             DPR Generator
                                            │
                                            ▼
                                         PDF Output
🧩 Technology Stack
Layer	Technology
Frontend	Next.js / React
Styling	Tailwind CSS
Icons	Lucide Icons
Backend	Next.js API Routes / Node.js
Matching Engine	TypeScript / JavaScript rule-based logic
Dataset	JSON
OCR	Tesseract.js
Speech Recognition	Web Speech API
PDF Generation	jsPDF
Development	Visual Studio Code
Package Manager	npm
Deployment	Vercel
Version Control	Git + GitHub
📁 Project Structure
yojana-setu/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── match/
│   │   │       └── route.ts
│   │   │
│   │   └── page.tsx
│   │
│   └── data/
│       └── schemes.json
│
├── public/
│
├── docs/
│   ├── screenshots/
│   ├── architecture/
│   ├── presentation/
│   └── documentation/
│
├── package.json
├── package-lock.json
├── README.md
├── .gitignore
└── ...
🔄 Application Workflow
Step 1 — Applicant enters profile

The applicant provides information through the questionnaire.

Personal Information
        ↓
Category
        ↓
Income
        ↓
Education
        ↓
Location
        ↓
Business Sector
        ↓
Capital Requirement
Step 2 — Profile processing

The entered information is normalized into a structured profile.

For example:

{
  "age": 28,
  "gender": "Male",
  "category": "SC",
  "education": "Graduate",
  "income": 200000,
  "location": "Rural",
  "sector": "Agriculture-Allied",
  "capitalRequired": 1200000
}
Step 3 — Scheme matching

The profile is sent to the matching API:

/api/match

The API compares the applicant profile against the configured scheme eligibility rules.

Step 4 — Results

The application returns matching schemes with information such as:

Scheme name
Ministry
Description
Maximum loan/support limit
Match percentage
Eligibility reasons
Step 5 — Document pre-check

The applicant can upload relevant documents for OCR-based preliminary checking.

Step 6 — DPR generation

The applicant can generate a preliminary project report based on their profile and selected scheme.

🔌 API

The primary matching endpoint is:

POST /api/match

The API receives applicant profile information and returns matched schemes.

Example request structure
{
  "age": 28,
  "gender": "Male",
  "category": "SC",
  "education": "Graduate",
  "income": 200000,
  "location": "Rural",
  "sector": "Agriculture-Allied",
  "capitalRequired": 1200000
}
Example response structure
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "example-scheme",
      "name": "Example Scheme",
      "ministry": "Example Ministry",
      "description": "Scheme description",
      "maxLoanLimit": 1000000,
      "matchPercentage": 85,
      "reasons": [
        "Age falls within the configured range",
        "Applicant category is supported",
        "Selected sector is supported"
      ]
    }
  ]
}
🧠 Why Rule-Based Matching?

The current prototype intentionally uses an explainable eligibility engine rather than depending entirely on a machine-learning model.

This provides several advantages for a government-scheme discovery prototype:

Transparency

The system can explain why a scheme matched.

Predictability

The same profile produces consistent results when the underlying dataset and rules remain unchanged.

Maintainability

Eligibility rules can be updated directly in the structured scheme dataset.

Demonstrability

The matching process can be clearly explained during a hackathon presentation.

Future scalability

The rule-based engine can later be extended with more sophisticated ranking, semantic search, or AI-assisted recommendation capabilities.

🔐 Privacy & Security Considerations

The prototype is designed as a demonstration application and should not be considered a production government service.

A production implementation would require additional security measures such as:

Secure authentication
Role-based access control
Encrypted data transmission
Secure document storage
Data encryption at rest
Audit logging
Consent management
Personal data minimization
Secure API validation
Government-approved hosting and infrastructure
Appropriate compliance and security reviews

The current prototype should therefore be used for demonstration and evaluation purposes.

📊 Current Prototype Scope

The current implementation focuses on demonstrating the core concept.

Implemented
 Government-style user interface
 Multi-step applicant questionnaire
 English/Hindi interface options
 Voice-based profile input
 English/Hindi speech recognition
 Natural number and amount parsing
 Rule-based scheme matching
 Explainable match reasons
 Structured scheme dataset
 20-scheme prototype dataset
 OCR document pre-verification
 English/Hindi OCR
 Document type detection assistance
 Scheme document requirements
 Preliminary DPR generation
 Sector-specific project planning
 Illustrative financial calculations
 PDF generation
 GitHub repository
 Vercel deployment
Planned / Future Enhancements
 Larger verified government scheme database
 Automated periodic scheme-data updates
 Integration with official government scheme APIs where available
 Official application deep links
 Secure user authentication
 Secure document storage
 Production-grade multilingual support
 CSC and bank locator using map services
 Advanced AI-assisted scheme discovery
 Application status tracking
 Personalized application checklist
 Government-side analytics dashboard
🗺️ Future Expansion

Yojana Setu can be expanded into a larger ecosystem connecting applicants with support infrastructure.

A future version could provide:

                    YOJANA SETU
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   Scheme Finder     Document Help     DPR Builder
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                Application Guidance
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
          CSC Centre              Bank
             │                       │
             └───────────┬───────────┘
                         ▼
                  Applicant Support

This would allow Yojana Setu to evolve from a scheme discovery tool into a broader entrepreneurship-support platform.

🖥️ Screenshots

Screenshots of the project are maintained inside:

docs/screenshots/

Suggested screenshots include:

Home / Landing Page
docs/screenshots/01-home.png
Applicant Questionnaire
docs/screenshots/02-questionnaire.png
Voice Input
docs/screenshots/03-voice-input.png
Scheme Matching
docs/screenshots/04-scheme-matching.png
Document OCR
docs/screenshots/05-document-ocr.png
DPR Generator
docs/screenshots/06-dpr-generator.png

Update the filenames above if your actual screenshot filenames are different.

🏛️ Architecture Diagram

The system architecture diagram is maintained in:

docs/architecture/

Recommended file:

docs/architecture/system-architecture.png
🎥 Demo Video

The project demonstration video can be linked here after uploading it to YouTube, Google Drive, or another suitable hosting platform.

Demo Video:
[ADD YOUR DEMO VIDEO LINK HERE]

The video should demonstrate:

Opening Yojana Setu
Entering an applicant profile
Using voice input
Running scheme matching
Viewing eligibility reasons
Uploading a sample document
Running OCR pre-verification
Selecting a scheme
Generating the preliminary DPR
Viewing the generated PDF
📑 Presentation

The project presentation is maintained in:

docs/presentation/

Example:

docs/presentation/Yojana-Setu-SIH-2026.pptx

You can also add a direct GitHub link to the presentation once the final filename is confirmed.

📘 Project Documentation

Detailed project documentation and reports are maintained in:

docs/documentation/

Possible documentation includes:

Project report
Software requirements
Technical documentation
System design
Testing documentation
Future scope
🌐 Live Demo

The project has been deployed using Vercel.

Live Application:
[ADD YOUR VERCEL URL HERE]

⚙️ Installation & Setup
Prerequisites

Make sure the following are installed:

Node.js
npm
Git
Visual Studio Code
1. Clone the repository
git clone https://github.com/advait-0611/yojana-setu.git
2. Enter the project directory
cd yojana-setu
3. Install dependencies
npm install
4. Start the development server
npm run dev

The application will normally be available at:

http://localhost:3000
5. Build the project

To verify the production build:

npm run build
6. Start the production server

After a successful build:

npm start
🧪 Testing

The prototype can be tested using different applicant profiles.

Example Profile 1 — SC + Agriculture
Age: 28
Gender: Male
Category: SC
Education: Graduate
Location: Rural
Annual Income: ₹2,00,000
Sector: Agriculture-Allied
Capital Required: ₹12,00,000
Example Profile 2 — Woman + Services
Age: 32
Gender: Female
Category: General
Education: Graduate
Location: Urban
Annual Income: ₹3,00,000
Sector: Services
Capital Required: ₹8,00,000
Example Profile 3 — OBC + Trading
Age: 35
Gender: Male
Category: OBC
Education: 12th
Location: Rural
Annual Income: ₹2,50,000
Sector: Trading
Capital Required: ₹5,00,000

These profiles can be used to demonstrate how different applicant characteristics affect the scheme matching results.

📈 Demo Scenario

A typical demonstration can follow this sequence:

1. Open Yojana Setu
        ↓
2. Introduce the problem
        ↓
3. Enter applicant information
        ↓
4. Demonstrate voice input
        ↓
5. Submit profile
        ↓
6. Display matched schemes
        ↓
7. Explain match reasons
        ↓
8. Upload a sample document
        ↓
9. Run OCR pre-verification
        ↓
10. Select a relevant scheme
        ↓
11. Generate preliminary DPR
        ↓
12. Show generated PDF
        ↓
13. Explain future expansion

This demonstrates the complete journey from scheme discovery to preliminary project preparation.

⚠️ Prototype Disclaimer

Yojana Setu is a student-developed prototype created for Smart India Hackathon 2026.

The platform is intended to demonstrate the concept of structured government-scheme discovery and eligibility assistance.

The scheme information and eligibility rules used by the prototype are maintained in the project's configured dataset and should not be treated as a live or exhaustive representation of all current government schemes.

The matching results are indicative only and do not constitute:

Government approval
Loan approval
Subsidy approval
Eligibility certification
Legal advice
Financial advice
Government-issued documentation
Official document authenticity verification

Final eligibility, sanction, funding, documentation, and application decisions remain with the relevant government department, financial institution, or authorized implementing agency.

Applicants should verify current eligibility requirements and application procedures through the relevant official government sources before submitting an application.

🔮 Future Scope

The long-term vision of Yojana Setu is to make government entrepreneurship-support information easier to discover and understand.

Future versions could include:

1. Larger Scheme Knowledge Base

Expand the current 20-scheme prototype dataset into a larger, regularly maintained database.

2. Official Data Integration

Where technically and legally available, integrate official government APIs and scheme information sources.

3. Advanced AI Matching

Use NLP and semantic matching to interpret natural-language applicant descriptions and scheme eligibility documents.

4. Multilingual Accessibility

Support additional Indian languages beyond English and Hindi.

5. CSC and Bank Locator

Help applicants locate nearby Common Service Centres and relevant banking/support infrastructure.

6. Application Assistance

Provide step-by-step application checklists and official application links.

7. Secure Applicant Accounts

Allow applicants to save profiles, documents, matched schemes, and generated reports securely.

8. Application Tracking

Provide a centralized view of application progress where integrations are available.

9. Administrative Tools

Provide authorized administrators with tools for maintaining scheme information and monitoring platform usage.

👥 Team

Project: Yojana Setu | योजना सेतु

Hackathon: Smart India Hackathon 2026

Problem Statement: SIH26092

Sponsor: Ministry of Social Justice and Empowerment

Repository:
https://github.com/advait-0611/yojana-setu

Add your complete team member names, college/institute, and roles here before the final submission if required.

📂 Repository Resources
Resource	Location
Source Code	src/
Scheme Dataset	src/data/schemes.json
Matching API	src/app/api/match/route.ts
Main Application	src/app/page.tsx
Screenshots	docs/screenshots/
Architecture	docs/architecture/
Presentation	docs/presentation/
Documentation	docs/documentation/
🤝 Contribution

This project was developed as an SIH 2026 prototype.

For collaborative development, contributors can create a separate branch:

git checkout -b feature-name

After making changes:

git add .
git commit -m "Describe your changes"
git push -u origin feature-name

Changes can then be reviewed and merged into the main branch.

📜 License

This repository is currently intended primarily for educational, hackathon, and prototype demonstration purposes.

If the project is later released as an open-source application, an appropriate open-source license can be added here.

⭐ Acknowledgement

Yojana Setu was developed as part of Smart India Hackathon 2026 in response to the challenge of improving access to government scheme information for marginalized and aspiring entrepreneurs.

The project focuses on combining:

Scheme Discovery + Eligibility Assistance + Accessibility + Document Support + Project Preparation

into a single user-friendly prototype.

योजना सेतु
Making government scheme discovery simpler, more understandable, and more accessible.

SIH 2026 • SIH26092 • Government Scheme Discovery & Eligibility Assistance


### After pasting

Save the file with:

**`Ctrl + S`**

Then run these commands:

```powershell
git status

Then:

git add README.md

Then:

git commit -m "Add detailed project README"

Then:

git push

Finally:

git status

You want the final result to say:

On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean