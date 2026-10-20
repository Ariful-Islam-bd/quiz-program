
# Academia Content Addition Guide

> **Purpose:** Academia পেজে নতুন class, subject, publisher, paper, chapter বা topic যোগ করার সম্পূর্ণ workflow
> **Last Updated:** 2026-10-20
> **Architecture:** Frontend (Cloudflare) + Backend API (Render) + MongoDB Atlas

---

## 📋 Table of Contents

1. [Academia Architecture Overview](#architecture-overview)
2. [Adding New Content — 3 Scenarios](#adding-content-scenarios)
3. [Content HTML File Format](#content-html-format)
4. [Frontend Integration (academia.js)](#frontend-integration)
5. [Content Metadata (backend)](#content-metadata)
6. [MongoDB Migration](#mongodb-migration)
7. [Testing & Deploy](#testing-deploy)
8. [Common Issues & Fixes](#common-issues)

---

## 🏗️ Architecture Overview

### Data Flow:
HTML File (content/HSC/...) ← Source content
↓

content-metadata.json ← Mapping (topicId → file)
↓

Migration Script ← Uploads to MongoDB
↓

MongoDB Atlas ← Runtime storage
↓

Backend API (/api/v1/content/:topicId) ← Serve content
↓

Frontend academia.js ← Fetches + displays
↓

User Browser ← Rendered content

text

### Two Layers:

| Layer | File | Purpose |
|-------|------|---------|
| **Navigation Layer** | `frontend/js/pages/academia.js` (`CHAPTER_DATA`) | Class → Subject → Publisher → Paper → Chapter → Topic hierarchy |
| **Content Layer** | `content-metadata.json` + `content/*.html` + MongoDB | Actual HTML content per topic |

**Critical:** Both layers must have **same `topicId`**.

---

## 🎯 Adding Content — 3 Scenarios

### Scenario A: New Topic in Existing Chapter

**Example:** Existing `HSC-Math-3A` chapter-এ একটা নতুন "প্রশ্ন ১৬" topic add।

**Steps:**
1. HTML file তৈরি করুন
2. `content-metadata.json`-এ entry add
3. MongoDB-এ migrate
4. `academia.js`-এ `CHAPTER_DATA`-তে topic add
5. Test + Deploy

### Scenario B: New Chapter in Existing Subject

**Example:** `hmath-11` subject-এ "ত্রিকোণমিতি - অধ্যায় ৮" chapter add।

**Steps:**
1. HTML file তৈরি করুন (chapter-এর প্রতিটা topic-এর জন্য)
2. `content-metadata.json`-এ entries add
3. MongoDB-এ migrate
4. `academia.js`-এ `CHAPTER_DATA`-তে chapter add
5. Test + Deploy

### Scenario C: New Subject in Existing Class

**Example:** `class-11-12`-এ "পদার্থবিজ্ঞান" subject add।

**Steps:**
1. HTML files তৈরি করুন (সব chapter/topic)
2. `content-metadata.json`-এ entries add
3. MongoDB-এ migrate
4. `academia.js`-এ `SUBJECT_DATA` + `CHAPTER_DATA`-তে subject add
5. Test + Deploy

---

## 📝 Content HTML File Format

### ⚠️ Critical Rule — Extract Body Only

MongoDB-তে **শুধু `<body>`-এর ভেতরের content** save করবেন। `<!DOCTYPE>`, `<html>`, `<head>`, `<script>`, `<link>` tags **সব বাদ** দিতে হবে।

**কেন:** Frontend `renderContent()` method HTML inject করে। External `<script>`/`<link>` tags inject হলে execute হয় না। CSS/JS globally handle হবে।

### 📄 Complete HTML Sample — Math Solution

**File Path:** `content/HSC/Math/3A/3A_Q01-Q02_Solution.html`

```html
<!-- ═══════════════════════════════════════════════════════════════
     File Path: content/HSC/Math/3A/3A_Q01-Q02_Solution.html
     Topic ID: HSC-Math-3A-Q01-Q02
     Chapter: জটিল সংখ্যা (৩A)
     Type: Math Solution
     ═══════════════════════════════════════════════════════════════ -->

<div class="container">
    <div class="exercise-title">
        <h2>অনুশীলনী ৩(A)</h2>
    </div>

    <!-- ═══════════════ Problem 1 ═══════════════ -->
    <div class="problem-card">
        <div class="problem-title">
            <strong>১.</strong> নিচের জটিল সংখ্যাগুলোকে \(a + ib\) আকারে প্রকাশ কর:
        </div>

        <div class="problem-sub-title">
            <strong>(i)</strong> \(\frac{1 + i}{1 - i}\)
        </div>

        <div class="solution-title">সমাধান:</div>

        <div class="step">
            \(\frac{1 + i}{1 - i} = \frac{(1 + i)(1 + i)}{(1 - i)(1 + i)}\)
        </div>
        <div class="step-explain">
            হরের অনুবন্ধী জটিল সংখ্যা \((1 + i)\) দ্বারা লব ও হরকে গুণ করলাম।
        </div>

        <div class="step">
            \(= \frac{1 + 2i + i^2}{1 - i^2} = \frac{1 + 2i - 1}{1 - (-1)}\)
        </div>
        <div class="step-explain">
            \(i^2 = -1\) ধরে সরল করলাম।
        </div>

        <div class="step">
            \(= \frac{2i}{2} = i\)
        </div>

        <div class="step">
            ∴ \(a = 0, b = 1\)
        </div>
    </div>

    <!-- ═══════════════ Problem 2 ═══════════════ -->
    <div class="problem-card">
        <div class="problem-title">
            <strong>২.</strong> যদি \(z = 2 + 3i\) হয়, তবে \(|z|\) নির্ণয় কর।
        </div>

        <div class="solution-title">সমাধান:</div>

        <div class="step">
            \(|z| = \sqrt{x^2 + y^2} = \sqrt{2^2 + 3^2}\)
        </div>

        <div class="step">
            \(= \sqrt{4 + 9} = \sqrt{13}\)
        </div>
    </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════
     ⚠️ NO <script> tags at end
     ⚠️ NO <link> tags for CSS
     ⚠️ NO <!DOCTYPE>, <html>, <head>, <body> wrappers
     KaTeX loads globally from quiz.js / academia.js
     ═══════════════════════════════════════════════════════════════ -->
📄 Complete HTML Sample — CQ (Creative Question)
File Path: content/HSC/Chemistry/chem-1st-ch4/chem-1st-ch4-sq5.html

html
<div class="container ksc-content">
    <header>
        <h1>উচ্চ মাধ্যমিক রসায়ন ১ম পত্র</h1>
        <p>অধ্যায় ৪: রাসায়নিক পরিবর্তন (বাফার দ্রবণ)</p>
    </header>

    <!-- Stem (উদ্দীপক) -->
    <div class="stem-container">
        <strong>উদ্দীপক:</strong> রসায়ন গবেষণাগারে \(25^\circ\text{C}\) তাপমাত্রায় দুইটি 
        ভিন্ন বিকারে বাফার দ্রবণ তৈরি করা হলো। পাত্র 'X' এ ইথানয়িক এসিড 
        (\(\text{CH}_3\text{COOH}\)) এবং সোডিয়াম ইথানয়েটের (\(\text{CH}_3\text{COONa}\)) 
        মিশ্রণ এবং পাত্র 'Y' এ অ্যামোনিয়াম হাইড্রোক্সাইড (\(\text{NH}_4\text{OH}\)) 
        ও অ্যামোনিয়াম ক্লোরাইডের (\(\text{NH}_4\text{Cl}\)) মিশ্রণ প্রস্তুত করা হলো।
    </div>

    <!-- Question Card -->
    <article class="question-card">
        <div class="question-header">
            📌 সৃজনশীল প্রশ্ন - ০৫
        </div>

        <div class="sub-questions">
            <div class="sub-question-item">
                <span class="sub-question-prefix">(ক)</span>
                <span class="sub-question-text">বাফার দ্রবণ কাকে বলে?</span>
            </div>
            <div class="sub-question-item">
                <span class="sub-question-prefix">(খ)</span>
                <span class="sub-question-text">বিশুদ্ধ পানিতে সামান্য এসিড যোগ করলে 
                pH এর দ্রুত পরিবর্তন ঘটলেও বাফার দ্রবণে কেন ঘটে না? ব্যাখ্যা কর।</span>
            </div>
            <div class="sub-question-item">
                <span class="sub-question-prefix">(গ)</span>
                <span class="sub-question-text">উদ্দীপকের পাত্র 'X' এর অম্লীয় বাফার 
                দ্রবণে সামান্য পরিমাণ তীব্র এসিড (\(\text{HCl}\)) এবং তীব্র ক্ষার 
                (\(\text{NaOH}\)) যোগ করলে দ্রবণটি কীভাবে pH স্থির রাখে? 
                আয়নিক সমীকরণসহ ব্যাখ্যা করো।</span>
            </div>
            <div class="sub-question-item">
                <span class="sub-question-prefix">(ঘ)</span>
                <span class="sub-question-text">পাত্র 'X' এ মৃদু এসিড \(\text{CH}_3\text{COOH}\) 
                (\(100\text{ mL}, 0.1\text{ M}\)) এর সাথে \(50\text{ mL}, 0.1\text{ M NaOH}\) 
                মেশানো হয়, তবে প্রাপ্ত দ্রবণে বাফার ক্রিয়া বজায় থাকবে কি না? 
                গাণিতিক বিশ্লেষণ দাও।</span>
            </div>
        </div>

        <!-- Solution Section -->
        <div class="solution-section">
            <div class="solution-title">৫ নং প্রশ্নের সমাধান:</div>

            <!-- (ক) -->
            <div class="solution-sub-item">
                <span class="solution-sub-prefix">(ক) এর সমাধান:</span>
                <div class="solution-step">
                    যে দ্রবণে সামান্য পরিমাণ এসিড বা ক্ষার যোগ করলে তার pH মান 
                    প্রায় অপরিবর্তিত থাকে, তাকে বাফার দ্রবণ বলে।
                </div>
            </div>

            <!-- (খ) -->
            <div class="solution-sub-item">
                <span class="solution-sub-prefix">(খ) এর সমাধান:</span>
                <div class="solution-step">
                    বিশুদ্ধ পানিতে বাফার সিস্টেম থাকে না। ফলে সামান্য এসিড যোগ করলে 
                    \([\text{H}^+]\) এর ঘনমাত্রা বেড়ে যায়, তাই pH দ্রুত কমে।
                </div>
                <div class="solution-step">
                    কিন্তু বাফার দ্রবণে প্রোটন গ্রহণকারী (অনুবন্ধী ক্ষারক) এবং 
                    প্রোটন প্রদানকারী (মৃদু এসিড) উভয় উপাদান থাকে। যোগকৃত H⁺ বা OH⁻ 
                    এদের সাথে বিক্রিয়া করে প্রশমিত হয়, তাই pH স্থির থাকে।
                </div>
            </div>

            <!-- (গ) -->
            <div class="solution-sub-item">
                <span class="solution-sub-prefix">(গ) এর সমাধান:</span>
                <div class="solution-step">
                    <strong>সাম্যাবস্থা:</strong>
                    $$\text{CH}_3\text{COOH} \rightleftharpoons \text{CH}_3\text{COO}^- + \text{H}^+$$
                    $$\text{CH}_3\text{COONa} \rightarrow \text{CH}_3\text{COO}^- + \text{Na}^+$$
                </div>
                <div class="solution-step">
                    <strong>HCl যোগে:</strong> যোগকৃত H⁺, CH₃COO⁻ এর সাথে বিক্রিয়া করে।
                    $$\text{H}^+ + \text{CH}_3\text{COO}^- \rightleftharpoons \text{CH}_3\text{COOH}$$
                </div>
                <div class="solution-step">
                    <strong>NaOH যোগে:</strong> যোগকৃত OH⁻, CH₃COOH এর সাথে বিক্রিয়া করে।
                    $$\text{OH}^- + \text{CH}_3\text{COOH} \rightleftharpoons \text{H}_2\text{O} + \text{CH}_3\text{COO}^-$$
                </div>
                <div class="final-answer">
                    ∴ pH স্থির থাকে।
                </div>
            </div>

            <!-- (ঘ) -->
            <div class="solution-sub-item">
                <span class="solution-sub-prefix">(ঘ) এর সমাধান:</span>
                <div class="solution-step">
                    <strong>মোল সংখ্যা:</strong>
                    <br>\(n(\text{CH}_3\text{COOH}) = 0.1 \times 0.1 = 0.01\text{ mol}\)
                    <br>\(n(\text{NaOH}) = 0.05 \times 0.1 = 0.005\text{ mol}\)
                </div>
                <div class="solution-step">
                    <strong>বিক্রিয়া:</strong>
                    $$\text{CH}_3\text{COOH} + \text{NaOH} \rightarrow \text{CH}_3\text{COONa} + \text{H}_2\text{O}$$
                    <br>বিক্রিয়া শেষে: \(0.005\text{ mol}\) মৃদু এসিড + \(0.005\text{ mol}\) লবণ।
                </div>
                <div class="solution-step">
                    <strong>pH নির্ণয়:</strong>
                    $$\text{pH} = \text{pK}_a + \log_{10}\left(\frac{n_{\text{salt}}}{n_{\text{acid}}}\right)$$
                    $$\text{pH} = 4.745 + \log_{10}(1) = 4.745$$
                </div>
                <div class="final-answer">
                    ∴ দ্রবণে সমান মোলার এসিড ও লবণ থাকায় এটি কার্যকর অম্লীয় বাফার 
                    হিসেবে কাজ করবে এবং বাফার ক্রিয়া বজায় থাকবে।
                </div>
            </div>
        </div>
    </article>
</div>
📄 Complete HTML Sample — Quiz (MCQ)
File Path: content/HSC/ICT/ch3/ict_ch3_numbers.html

html
<div class="container">
    <div class="exercise-title">
        <h2>সংখ্যা পদ্ধতি — MCQ</h2>
    </div>

    <!-- Single MCQ -->
    <div class="question-card">
        <div class="question-header">
            <span class="question-serial-number"><b>১.</b></span>
            <span class="question-text-content">
                \((1010)_2\) সংখ্যাটিকে দশমিক পদ্ধতিতে প্রকাশ কর।
            </span>
        </div>
        <div class="options-container">
            <ul class="options">
                <li class="option">8</li>
                <li class="option">10</li>
                <li class="option">12</li>
                <li class="option">14</li>
            </ul>
        </div>
        <div class="solution-section">
            <div class="solution-title">সমাধান:</div>
            <div class="solution-step">
                \((1010)_2 = 1 \times 2^3 + 0 \times 2^2 + 1 \times 2^1 + 0 \times 2^0 = 8 + 0 + 2 + 0 = 10\)
            </div>
            <div class="final-answer">সঠিক উত্তর: 10</div>
        </div>
    </div>

    <!-- Group MCQ (Stimulant) -->
    <div class="question-card">
        <div class="stimulant-box">
            <strong>উদ্দীপক:</strong> একটি কম্পিউটারে 8-বিট রেজিস্টার ব্যবহার করা হয়।
        </div>
        <div class="question-header">
            <span class="question-serial-number"><b>২.</b></span>
            <span class="question-text-content">8-বিট রেজিস্টারে সর্বোচ্চ কতটি 
            ভিন্ন মান সংরক্ষণ করা যায়?</span>
        </div>
        <div class="options-container">
            <ul class="options">
                <li class="option">128</li>
                <li class="option">255</li>
                <li class="option">256</li>
                <li class="option">512</li>
            </ul>
        </div>
        <div class="solution-section">
            <div class="solution-title">সমাধান:</div>
            <div class="solution-step">
                8-বিটে \(2^8 = 256\) টি ভিন্ন মান সংরক্ষণ করা যায়।
            </div>
            <div class="final-answer">সঠিক উত্তর: 256</div>
        </div>
    </div>
</div>
📋 Essential CSS Classes (globally available)
Class	Purpose
.container	Main wrapper (max-width 900px)
.problem-card	Math problem box
.problem-title	Problem heading
.step	Solution step (code-like box)
.step-explain	Explanation paragraph
.final-answer	Highlighted final answer
.question-card	CQ question box
.sub-question-item	(ক), (খ), (গ), (ঘ) each
.solution-sub-item	Individual solution
.stimulant-box	Group question stem
.options / .option	MCQ options
.ksc-content	KSC-specific wrapper
.stem-container	KSC stem
🎯 Critical Notes
✅ DO	❌ DON'T
<body>-এর ভেতরের content রাখুন	<!DOCTYPE>, <html>, <head>, <body> রাখবেন না
MathML বা $...$ / $$...$$ use করুন	Local KaTeX <script>/<link> রাখবেন না
<div class="container"> wrapper রাখুন	../katex/ path রাখবেন না
CSS classes globally available ব্যবহার করুন	Custom <style> tag রাখবেন না
SVG inline রাখুন	External SVG file reference রাখবেন না
⚠️ KaTeX: Auto-loaded by academia.js। $x^2$ (inline) বা $$x^2$$ (display) work করবে।

🎨 Frontend Integration (academia.js)
Structure Types:
Type	When to Use	Structure
publisher-nested	Multiple books/papers	Publisher → Paper → Chapters
flat	Single book, no publisher	Chapters directly
A) SUBJECT_DATA — Class-এ Subject Add
File: frontend/js/pages/academia.js

খুঁজুন: const SUBJECT_DATA = {

তারপর class-specific array-এ new subject add করুন:

javascript
const SUBJECT_DATA = {
    // ... existing classes
    'class-11-12': [
        { id: 'hmath-11', name: 'উচ্চতর গণিত', icon: '📐', chapters: 6 },
        { id: 'ict-11', name: 'তথ্য ও যোগাযোগ প্রযুক্তি', icon: '💻', chapters: 2 },
        { id: 'logic-11', name: 'যুক্তিবিদ্যা', icon: '🧠', chapters: 1 },
        
        // 🆕 NEW SUBJECT
        { id: 'physics-11', name: 'পদার্থবিজ্ঞান', icon: '⚛️', chapters: 12 },
        
        { id: 'chemistry-11', name: 'রসায়ন', icon: '🧪', chapters: 10 },
        { id: 'biology-11', name: 'জীববিজ্ঞান', icon: '🧬', chapters: 8 }
    ]
};
B) CHAPTER_DATA — Nested Structure (Publisher + Paper)
খুঁজুন: const CHAPTER_DATA = {

Add new subject with nested structure:

javascript
const CHAPTER_DATA = {
    // ... existing subjects (hmath-11, ict-11, logic-11, chemistry-11)
    
    // 🆕 NEW SUBJECT — Publisher Nested
    'physics-11': {
        type: 'publisher-nested',
        publishers: [
            {
                id: 'akkhor-phy',
                name: 'অক্ষরপত্র',
                icon: '📘',
                description: 'অক্ষরপত্র প্রকাশনী',
                papers: [
                    {
                        id: 'akkhor-phy-1st',
                        name: '১ম পত্র',
                        icon: '📕',
                        chapters: [
                            {
                                id: 'phy-akkhor-ch1',
                                number: 1,
                                name: 'ভৌত জগৎ ও পরিমাপ',
                                icon: '🌍',
                                topics: [
                                    { id: 'HSC-Phy-Akkhor-1st-Ch1-Q1', name: 'প্রশ্ন ১ সমাধান', icon: '✅', type: 'note' },
                                    { id: 'HSC-Phy-Akkhor-1st-Ch1-Q2', name: 'প্রশ্ন ২ সমাধান', icon: '✅', type: 'note' }
                                ]
                            },
                            {
                                id: 'phy-akkhor-ch2',
                                number: 2,
                                name: 'ভেক্টর',
                                icon: '➡️',
                                topics: [
                                    { id: 'HSC-Phy-Akkhor-1st-Ch2-Q1', name: 'প্রশ্ন ১', icon: '✅', type: 'note' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'akkhor-phy-2nd',
                        name: '২য় পত্র',
                        icon: '📗',
                        chapters: [
                            {
                                id: 'phy-akkhor-ch3',
                                number: 3,
                                name: 'তাপগতিবিদ্যা',
                                icon: '🌡️',
                                topics: [
                                    { id: 'HSC-Phy-Akkhor-2nd-Ch3-Q1', name: 'প্রশ্ন ১', icon: '✅', type: 'note' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
};
C) CHAPTER_DATA — Flat Structure (No Publisher)
Single book/publisher ছাড়া:

javascript
'biology-11': {
    type: 'flat',
    chapters: [
        {
            id: 'bio-ch1',
            number: 1,
            name: 'কোষ ও কোষের গঠন',
            icon: '🔬',
            topics: [
                { id: 'HSC-Bio-Ch1-Q1', name: 'প্রশ্ন ১', icon: '✅', type: 'note' }
            ]
        }
    ]
}
📋 CHAPTER_DATA Structure Fields
Field	Type	Required	Example
id	string	✅	'phy-akkhor-ch1' (unique!)
number	number	✅	1, 3, 0
name	string	✅	'ভৌত জগৎ ও পরিমাপ'
icon	emoji	⚠️	'🌍'
topics	array	✅	[{ id, name, icon, type }]
Topic fields:

id → MUST match content-metadata.json-এর topicId

name → UI-তে দেখাবে

icon → '📝' বা '✅'

type → 'note' বা 'quiz'

🗂️ Content Metadata (backend)
File: backend/scripts/content-metadata.json

Format:

json
[
  {
    "topicId": "HSC-Phy-Akkhor-1st-Ch1-Q1",
    "name": "প্রশ্ন ১ সমাধান",
    "category": {
      "board": "HSC",
      "className": "পদার্থবিজ্ঞান",
      "subject": "পদার্থবিজ্ঞান ১ম পত্র",
      "chapter": "ভৌত জগৎ ও পরিমাপ",
      "topic": "প্রশ্ন ১"
    },
    "filePath": "HSC/Physics/akkhor-1st-ch1/phy-akkhor-1st-ch1-q1.html",
    "tags": ["physics", "1st-paper", "ch1", "solution"]
  }
]
🎯 Field Reference
Field	Required	Purpose
topicId	✅	Unique ID — must match academia.js topic.id
name	✅	Display name
category.board	✅	'HSC', 'SSC', etc.
category.className	✅	Subject name in Bengali
category.subject	✅	Full subject (e.g., "উচ্চতর গণিত")
category.chapter	✅	Chapter name
category.topic	✅	Topic name
filePath	✅	Relative to content/ folder
tags	⚠️	Optional — for search
🚨 Critical Rules
topicId MUST be unique across all metadata

topicId MUST match academia.js-এ topic.id

filePath MUST exist at content/<filePath>

No trailing slashes in filePath

📥 MongoDB Migration
Step 1: File Location Confirm করুন
HTML file যেখানে রাখবেন:

text
content/
└── HSC/
    └── Physics/
        ├── akkhor-1st-ch1/
        │   ├── phy-akkhor-1st-ch1-q1.html
        │   └── phy-akkhor-1st-ch1-q2.html
        └── akkhor-1st-ch2/
            └── phy-akkhor-1st-ch2-q1.html
Step 2: Validation চালান
powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0

npm run migrate:content:validate
Expected:

text
✅ All files found
✅ All metadata valid
📊 Summary: XX items
⚠️ যদি error আসে:

File not found → filePath typo check

Duplicate topicId → ID collision fix

Invalid JSON → comma/bracket check

Step 3: Dry Run (Preview)
powershell
npm run migrate:content:dry
Expected:

text
📋 DRY RUN — Would create/update:
   ✅ HSC-Phy-Akkhor-1st-Ch1-Q1 → v1
   ✅ HSC-Phy-Akkhor-1st-Ch1-Q2 → v1
   
📊 Summary: 2 new, 0 updated
Step 4: Live Migration
powershell
npm run migrate:content
Expected:

text
✅ Created: HSC-Phy-Akkhor-1st-Ch1-Q1
✅ Created: HSC-Phy-Akkhor-1st-Ch1-Q2

📊 Migration Summary
   Created:  2
   Updated:  0
   Skipped:  XX
   Failed:   0
Step 5: Verify MongoDB-তে Content আছে
powershell
Invoke-RestMethod "https://quiz-program.onrender.com/api/v1/content/HSC-Phy-Akkhor-1st-Ch1-Q1" | ConvertTo-Json -Depth 2
Expected:

json
{
  "success": true,
  "data": {
    "topicId": "HSC-Phy-Akkhor-1st-Ch1-Q1",
    "html": "<div class=\"container\">...</div>",
    "version": 1,
    "updatedAt": "..."
  }
}
⚠️ যদি 404 আসে:

Migration fail হয়েছে

Metadata entry check করুন

MongoDB connection verify করুন

🧪 Testing & Deploy
Local Test
Terminal #1 — Backend:

powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0
npm run dev
Terminal #2 — Frontend:

powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0
npm run serve:frontend
Browser Test:

http://127.0.0.1:3000 (Incognito)

Navigate: Academia → HSC → নতুন Subject → Publisher → Paper → Chapter

Verify:

✅ New subject visible

✅ Chapter expand হয়

✅ Topic click → content load

✅ Math renders (KaTeX)

✅ Styles apply

❌ No console errors

Deploy to Production
Terminal #3 — Git:

powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0

# Status
git status

# Stage
git add content/
git add backend/scripts/content-metadata.json
git add frontend/js/pages/academia.js

# Commit
git commit -m "feat(academia): Add [Subject] with [Chapter count] chapters

- Added X new content files
- Updated academia.js CHAPTER_DATA
- Updated content-metadata.json
- Migrated to MongoDB"

# Push
git push origin main
Deploy Wait:

Cloudflare (Frontend): ~14s

Render (Backend): ~2 min

MongoDB: Instant (already migrated)

Production Verify:

text
https://school-college.pages.dev (Incognito)
→ Academia → Navigate to new content
→ Verify all works
🐛 Common Issues & Fixes
Issue 1: Topic Click → "কন্টেন্ট লোড করতে সমস্যা হয়েছে"
Cause: Content not in MongoDB

Fix:

powershell
# Verify content exists in API
Invoke-RestMethod "https://quiz-program.onrender.com/api/v1/content/YOUR-TOPIC-ID"

# If 404: Run migration
npm run migrate:content
Issue 2: Math Render হয় না
Cause: KaTeX not loaded, OR delimiters wrong

Fix:

Use $x^2$ (inline) or $$x^2$$ (display)

Avoid <math> XML (only for specific quiz types)

Check browser console for KaTeX errors

Issue 3: CSS Apply হয় না
Cause: Custom CSS classes not in global stylesheet

Fix:

powershell
# Add custom CSS to:
frontend/css/styles_math_sol.css
# অথবা
frontend/css/academia.css

# Then rebuild:
npm run build:minify
Issue 4: Chapter Body Cut Off
Cause: Old max-height CSS limit

Fix:

css
/* In academia.css — should be: */
.chapter-body.open {
    max-height: none;    /* NOT 800px */
    overflow: visible;
}
Issue 5: Publisher/Paper Navigation Breaks
Cause: Chapter IDs not unique across publishers

Fix:

Prefix chapter IDs with publisher/paper: phy-akkhor-1st-ch1

NOT ch1 (ambiguous)

Issue 6: Browser Shows Old Content
Cause: Browser cache

Fix:

powershell
# 1. Incognito window
# 2. Hard reload: Ctrl + Shift + R
# 3. Clear cache: F12 → Application → Clear site data
Issue 7: Cloudflare Build Fails
Cause: Syntax error in academia.js

Fix:

powershell
# Local syntax check
node -c frontend/js/pages/academia.js
# অথবা
node --check frontend/js/pages/academia.js
🎯 Quick Workflow (Cheat Sheet)
নতুন Topic যোগ করার জন্য:

powershell
# ═══════════════════════════════════════════
# STEP 1: HTML File তৈরি
# ═══════════════════════════════════════════
# File: content/<path>/<topic>.html
# Content: <div class="container">...</div> only

# ═══════════════════════════════════════════
# STEP 2: content-metadata.json-এ entry add
# ═══════════════════════════════════════════
code backend\scripts\content-metadata.json
# Add: { topicId, name, category, filePath, tags }

# ═══════════════════════════════════════════
# STEP 3: academia.js-এ CHAPTER_DATA-তে topic add
# ═══════════════════════════════════════════
code frontend\js\pages\academia.js
# Add: { id: '<same-topicId>', name, icon, type }

# ═══════════════════════════════════════════
# STEP 4: Validate & Migrate
# ═══════════════════════════════════════════
cd D:\complete_quiz_for-Hosting_ver-2-0-0
npm run migrate:content:validate
npm run migrate:content:dry
npm run migrate:content

# ═══════════════════════════════════════════
# STEP 5: Local Test
# ═══════════════════════════════════════════
# Terminal #1:
npm run dev

# Terminal #2:
npm run serve:frontend

# Browser: http://127.0.0.1:3000
# Navigate → Verify topic loads

# ═══════════════════════════════════════════
# STEP 6: Deploy
# ═══════════════════════════════════════════
git add content/ backend/scripts/content-metadata.json frontend/js/pages/academia.js
git commit -m "feat(academia): Add new topic"
git push origin main

# ═══════════════════════════════════════════
# STEP 7: Production Verify (after ~2 min)
# ═══════════════════════════════════════════
# https://school-college.pages.dev (Incognito)
📊 Topic ID Naming Convention
Format:

text
<Board>-<Subject>-<Publisher>-<Paper>-<Chapter>-<Topic>

Examples:
- HSC-Math-Okkhorpotro-1st-Differ-9A
- HSC-Math-3A-Q01-Q02
- HSC-Chem-1st-Ch4-SQ5
- HSC-Phy-Akkhor-1st-Ch1-Q1
Rules:

✅ Uppercase first letter of each segment

✅ Hyphens between segments

✅ No spaces, no Bengali in ID (English/numbers only)

✅ Short but descriptive

📋 Complete Checklist
নতুন Content যোগ করার সময়:

Content Files:
□ HTML file তৈরি (<div class="container"> wrapper)
□ Body content only (no <html>, <head>, <body>)
□ No local <script> or <link> tags
□ KaTeX $...$ / $$...$$ syntax
□ File path correct (content/<path>)
Metadata:
□ content-metadata.json-এ entry added
□ topicId unique
□ filePath matches actual file
□ Category fields filled
Frontend:
□ academia.js-এ CHAPTER_DATA update
□ topic.id = metadata.topicId
□ Chapter ID unique
□ Icon selected appropriately
Migration:
□ migrate:content:validate → pass
□ migrate:content:dry → preview ok
□ migrate:content → success
Testing:
□ Local backend running
□ Local frontend running
□ Browser: new content visible
□ Math renders
□ Styles apply
□ No console errors
□ Mobile view works
□ Dark mode works
Deploy:
□ Git commit with clear message
□ Git push
□ Cloudflare deploy success
□ Render deploy success
□ Production verify pass
📞 Quick Reference
File Locations:
text
project-root/
├── content/                          ← HTML source files
│   └── HSC/
│       ├── Math/
│       ├── Chemistry/
│       └── Physics/
├── backend/
│   └── scripts/
│       └── content-metadata.json     ← Topic mappings
└── frontend/
    ├── js/pages/academia.js          ← CHAPTER_DATA
    └── css/
        ├── academia.css              ← Chapter/subject styles
        └── styles_math_sol.css       ← Content styles
Commands:
powershell
# Validate metadata
npm run migrate:content:validate

# Dry run
npm run migrate:content:dry

# Live migration
npm run migrate:content

# Verbose (detailed logs)
npm run migrate:content:verbose

# Local backend
npm run dev

# Local frontend
npm run serve:frontend

# Production build
npm run build:minify
API Endpoints:
powershell
# Health check
Invoke-RestMethod "https://quiz-program.onrender.com/api/v1/health"

# Content by ID
Invoke-RestMethod "https://quiz-program.onrender.com/api/v1/content/<topicId>"

# All categories
Invoke-RestMethod "https://quiz-program.onrender.com/api/v1/content/categories"

# Stats
Invoke-RestMethod "https://quiz-program.onrender.com/api/v1/content/stats/summary"
Document Version: 1.0.0
Created: 2026-10-20
Maintainer: Ariful Islam
Next Review: When adding new content type or structure

text

---

**Save করুন:** `Ctrl + S`

---

## 🎯 Guide File-এ কী কী আছে?

| Section | Content |
|---------|---------|
| **Architecture Overview** | Data flow diagram, 2-layer system |
| **3 Scenarios** | New topic / chapter / subject — step-by-step |
| **HTML Format** | 3 complete samples (Math, CQ, Quiz) |
| **CSS Classes** | Reference table of available classes |
| **Frontend Integration** | `academia.js` structure examples |
| **Content Metadata** | `content-metadata.json` full format |
| **MongoDB Migration** | Validate → Dry run → Live commands |
| **Testing & Deploy** | Local + production workflow |
| **Common Issues** | 7 common problems with fixes |
| **Quick Workflow** | Cheat sheet (copy-paste ready) |
| **Naming Convention** | Topic ID format |
| **Complete Checklist** | 30+ checkpoints |

---

## 🚀 এখন Action

**এই commands চালান:**

```powershell
cd D:\complete_quiz_for-Hosting_ver-2-0-0
code docs\academia-content-addition-guide.md
তারপর উপরের markdown content paste করে save করুন (Ctrl + S)।

তারপর commit:

powershell
git add docs/academia-content-addition-guide.md
git commit -m "docs: Add academia content addition guide"
git push origin main
File-এ সব format, sample HTML, migration commands, testing steps — সব আছে। 🎯

ভবিষ্যতে নতুন content যোগ করার সময় এই guide follow করলেই হবে! 📋

