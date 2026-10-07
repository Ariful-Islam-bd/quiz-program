# 📚 কুইজ প্রোগ্রাম

## প্রকল্পের বিবরণ
একটি ইন্টারেক্টিভ এডুকেশন প্ল্যাটফর্ম যেখানে ব্যবহারকারীরা তাদের পছন্দমতো বিভিন্ন বিষয়ের উপর লেখা টপিক পড়তে পারেন, বিভিন্ন শ্রেণির বিভিন্ন বিষয়ে কুইজ দিতে পারেন এবং তাদের অগ্রগতি ট্র্যাক করতে পারেন।

## প্রযুক্তি স্ট্যাক
- **ফ্রন্টএন্ড**: HTML, CSS, JavaScript (Vanilla)
- **ব্যাকএন্ড**: Node.js, Express.js
- **ডেটাবেস**: MongoDB
- **অন্যান্য**: KaTeX (গাণিতিক সূত্র)

## ফোল্ডার স্ট্রাকচার
quiz_program/
│
├── backend/                              # ব্যাকএন্ড সার্ভার
│   ├── config/                           # কনফিগারেশন ফাইল
│   │   ├── constants.js                  # কনস্ট্যান্ট ডেফিনেশন
│   │   └── db.js                         # MongoDB ডাটাবেস কানেকশন
│   │
│   ├── controllers/                      # কন্ট্রোলার (বিজনেস লজিক)
│   │   ├── authController.js             # অথেনটিকেশন (রেজিস্টার/লগইন)
│   │   └── quizController.js             # কুইজ সংক্রান্ত লজিক
│   │
│   ├── middleware/                       # মিডলওয়্যার
│   │   ├── authMiddleware.js             # অথেনটিকেশন চেক
│   │   └── errorMiddleware.js            # গ্লোবাল এরর হ্যান্ডলিং
│   │
│   ├── models/                           # ডেটাবেস মডেল
│   │   ├── Question.js                   # প্রশ্ন মডেল
│   │   ├── Structure.js                  # স্ট্রাকচার মডেল (assortedData)
│   │   └── User.js                       # ইউজার মডেল
│   │
│   ├── routes/                           # API রাউট
│   │   ├── authRoutes.js                 # অথেনটিকেশন রাউট
│   │   ├── categoryRoutes.js             # ক্যাটাগরি রাউট
│   │   └── quizRoutes.js                 # কুইজ রাউট
│   │
│   ├── scripts/
│   │   └── test-email.js
│   │   
│   ├── seed/                             # ডামি ডেটা সিডার
│   │   └── seeder.js                     # ডেটাবেস সিডিং
│   │
│   ├── services/
│   │   └── emailService.js
│   │
│   ├── utils/                            # ইউটিলিটি ফাংশন
│   │   ├── appError.js                   # কাস্টম এরর ক্লাস
│   │   ├── catchAsync.js                 # Async এরর হ্যান্ডলার
│   │   └── otpGenerator.js
│   │
│   └── server.js                         # সার্ভারের এন্ট্রি পয়েন্ট
│
├── frontend/                             # ফ্রন্টএন্ড
│   │
│   ├── assets/                           # স্ট্যাটিক অ্যাসেট
│   │   ├── icons/                        # আইকন ফাইল
│   │   └── images/                       # ইমেজ ফাইল
│   │
│   ├── content/                          # 📁 কন্টেন্ট ফাইল (HTML)
│   │   ├── HSC/                          # এইচএসসি শ্রেণি
│   │   │   ├── math/                     # গণিত
│   │   │   │   ├── 3A/                   # অধ্যায় ৩A
│   │   │   │   │   ├── 3A All Q Complex Numbers.html
│   │   │   │   │   ├── 3A Q01-Q02 Solution Comp Num.html
│   │   │   │   │   ├── 3A Q03-Q05 Solution Comp Num.html
│   │   │   │   │   ├── 3A Q06-Q08 Solution Comp Num.html
│   │   │   │   │   ├── 3A Q09 Solution Comp Num.html
│   │   │   │   │   ├── 3A Q10 Solution Comp Num.html
│   │   │   │   │   ├── 3A Q11 Solution Comp Num.html
│   │   │   │   │   └── 3A Q12-Q15 Solution Comp Num.html
│   │   │   │   └── 3B/                   # অধ্যায় 3B
│   │   │   │       ├── 3B All Q Complex Numbers.html
│   │   │   │       ├── 3B Q01-Q02.html
│   │   │   │       ├── 3B Q03-Q04.html
│   │   │   │       ├── 3B Q05-Q09.html
│   │   │   │       ├── 3B Q10-Q11.html
│   │   │   │       ├── 3B Q12.html
│   │   │   │       └── 3B Q13-Q17.html
│   │   │   ├── physics/                  # পদার্থবিজ্ঞান
│   │   │   ├── chemistry/                # রসায়ন
│   │   │   └── ...
│   │   ├── SSC/                          # এসএসসি শ্রেণি
│   │   ├── দাখিল/                        # দাখিল শ্রেণি
│   │   ├── ৮ম শ্রেণি/
│   │   ├── ৭ম শ্রেণি/
│   │   └── ...
│   │
│   ├── css/                              # স্টাইল শীট
│   │   ├── academia.css                  # একাডেমিয়া পেজ স্টাইল
│   │   ├── auth.css
│   │   ├── components.css                # কম্পোনেন্ট স্টাইল
│   │   ├── dark-mode.css                 # ডার্ক মোড স্টাইল
│   │   ├── main.css                      # মেইন স্টাইল
│   │   ├── profile.css
│   │   ├── quiz.css                      # কুইজ স্টাইল
│   │   ├── styles_math_sol.css           # গণিত কন্টেন্ট স্টাইল
│   │   └── welcome.css                   # ওয়েলকাম পেজ স্টাইল
│   │
│   ├── js/                               # জাভাস্ক্রিপ্ট
│   │   ├── core/                         # কোর ইঞ্জিন
│   │   │   ├── ProgressTracker.js        # প্রগ্রেস ট্র্যাকিং
│   │   │   ├── QuizEngine.js             # কুইজ ইঞ্জিন
│   │   │   ├── ScoreManager.js           # স্কোর ম্যানেজমেন্ট
│   │   │   └── Timer.js                  # টাইমার
│   │   │
│   │   ├── middleware/
│   │   │   └── auth-guard.js
│   │   │
│   │   ├── pages/                        # পেজ লজিক
│   │   │   ├── academia.js               # একাডেমিয়া পেজ
│   │   │   ├── auth.js
│   │   │   ├── profile.js
│   │   │   ├── quiz.js                   # কুইজ পেজ
│   │   │   ├── ResetPassword.js
│   │   │   └── welcome.js                # ওয়েলকাম পেজ
│   │   │
│   │   ├── renderers/                    # রেন্ডারার
│   │   │   ├── BaseRenderer.js           # বেস রেন্ডারার
│   │   │   ├── BlankRenderer.js          # ব্ল্যাঙ্ক রেন্ডারার
│   │   │   ├── MCQRenderer.js            # MCQ রেন্ডারার
│   │   │   └── RearrangingRenderer.js    # রিয়ারেঞ্জিং রেন্ডারার
│   │   │
│   │   ├── services/                     # সার্ভিস
│   │   │   ├── ApiService.js             # API কল সার্ভিস
│   │   │   ├── AuthServices.js
│   │   │   └── StorageService.js         # লোকাল স্টোরেজ সার্ভিস
│   │   │
│   │   ├── utils/                        # ইউটিলিটি
│   │   │   ├── constants.js              # কনস্ট্যান্ট
│   │   │   ├── AvatarColor.js
│   │   │   ├── session.js
│   │   │   ├── SoundManager.js
│   │   │   ├── validators.js
│   │   │   └── VibrationManager.js
│   │   │
│   │   └── app.js                        # মেইন এন্ট্রি পয়েন্ট
│   │
│   ├── katex/                            # KaTeX (গাণিতিক সূত্র)
│   │   ├── katex.min.css
│   │   ├── katex.min.js
│   │   └── contrib/
│   │       └── auto-render.min.js
│   │
│   ├── pages/
│   │   ├── academia.html
│   │   ├── profile.html
│   │   └── quiz.html
│   │
│   └── index.html                        # মেইন HTML ফাইল
│   └── reset-password.html
│
├── docs/                                 # 📁 ডকুমেন্টেশন
│   ├── README.md                         # প্রকল্পের বিবরণ
│   ├── CHANGELOG.md                      # পরিবর্তনের ইতিহাস
│   └── guides/                           # গাইডলাইন
│       ├── adding-content.md             # কন্টেন্ট যোগ করা
│       ├── adding-chapters.md            # অধ্যায় যোগ করা
│       ├── adding-classes.md             # শ্রেণি যোগ করা
│       └── folder-structure.md           # ফোল্ডার স্ট্রাকচার ব্যাখ্যা
│
├── node_modules/                         # npm ডিপেন্ডেন্সি
│
├── .env                                  # এনভায়রনমেন্ট ভেরিয়েবল
├── assortedData.js                       # ক্যাটাগরি ইনডেক্স ডেটা
├── mainQuizData.js                       # মেইন কুইজ ডেটা
├── package.json                          # npm প্যাকেজ কনফিগারেশন
└── package-lock.json                     # npm লক ফাইল


## 📊 কুইজ প্রজেক্টের সম্পূর্ণ ডেটা-ফ্লো
ডেটা-ফ্লোটি তিনটি প্রধান স্তরে বিভক্ত:

-**ফ্রন্টএন্ড → ব্যাকএন্ড** (API কল)

-**ব্যাকএন্ড → ডেটাবেস** (ডেটা রিট্রিভ)

-**ব্যাকএন্ড → ফ্রন্টএন্ড** (ডেটা রেসপন্স)


🔄 ১. সম্পূর্ণ ডেটা-ফ্লো ডায়াগ্রাম:
┌────────────────────────────────────────────────────────────────────────────┐
│                              ফ্রন্টএন্ড (Browser)                             │
│                                                                            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  Welcome    │    │   Quiz      │    │  Academia   │    │   Profile   │  │
│  │   Page      │    │   Filter    │    │    Page     │    │    Page     │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │         │
│         └──────────────────┼──────────────────┼──────────────────┘         │
│                            │                  │                            │
│                    ┌───────▼──────────────────▼───────┐                    │
│                    │         ApiService.js            │                    │
│                    │    (API কল ম্যানেজমেন্ট)          │                    │
│                    └───────┬──────────────────┬───────┘                    │
│                            │                  │                            │
│                            │    HTTP Request  │                            │
│                            │    (JSON Data)   │                            │
└────────────────────────────┼──────────────────┼────────────────────────────┘
                             │                  │
                             ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ব্যাকএন্ড (Node.js/Express)                      │
│                                                                             │
│                    ┌─────────────────────────────────┐                      │
│                    │         server.js               │                      │
│                    │    (Express App initialization) │                      │
│                    └───────────────┬─────────────────┘                      │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         │                          │                          │             │
│         ▼                          ▼                          ▼             │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐          │
│  │   Routes    │          │  Middleware │          │  Controllers│          │
│  │  (Router)   │──────────│  (Auth,     │──────────│  (Business  │          │
│  │             │          │   Error)    │          │   Logic)    │          │
│  └─────────────┘          └─────────────┘          └──────┬──────┘          │
│                                                           │                 │
│                                                   ┌───────▼───────┐         │
│                                                   │    Models     │         │
│                                                   │  (Mongoose)   │         │
│                                                   └───────┬───────┘         │
│                                                           │                 │
└───────────────────────────────────────────────────────────┼─────────────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              ডেটাবেস (MongoDB)                          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                         quiz_program                             │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌──────────────────────┐  │   │
│  │  │    users      │  │   questions   │  │     structures       │  │   │
│  │  │  collection   │  │  collection   │  │     collection       │  │   │
│  │  │               │  │               │  │                      │  │   │
│  │  │  - _id        │  │  - _id        │  │  - _id               │  │   │
│  │  │  - name       │  │  - id         │  │  - name              │  │   │
│  │  │  - email      │  │  - isGroup    │  │  - data (assorted)   │  │   │
│  │  │  - password   │  │  - questions  │  │                      │  │   │
│  │  │  - role       │  │  - category   │  │                      │  │   │
│  │  │  - createdAt  │  │  - level      │  │                      │  │   │
│  │  └───────────────┘  │  - createdBy  │  └──────────────────────┘  │   │
│  │                     │  - createdAt  │                            │   │
│  │                     └───────────────┘                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘


🔄 ২. কুইজ ডেটা-ফ্লো (বিস্তারিত):
┌───────────────────────────────────────────────────────────────────────────┐
│                     কুইজ শুরু করার ডেটা-ফ্লো                               │
└───────────────────────────────────────────────────────────────────────────┘

[১] ইউজার ফিল্টার সিলেক্ট করে "কুইজ শুরু করুন" ক্লিক করে
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  frontend/js/pages/quiz.js - #startQuiz()                               │
│  ├── ফিল্টার ডেটা সংগ্রহ: { board, className, subject, chapter, exercise } │
│  └── #startQuizWithFilters(filters) কল করে                             │
└─────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  frontend/js/services/ApiService.js - getFilteredQuizzes(filters)          │
│  ├── API কল: GET /api/v1/quizzes/filter?board=X&className=Y&...           │
│  └── ফ্রন্টএন্ড → ব্যাকএন্ড রিকোয়েস্ট পাঠায়                                       │
└────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  backend/routes/quizRoutes.js - GET /filter                                │
│  ├── কুয়েরি প্যারামিটার পার্স করে                                               │
│  └── quizController.getFilteredQuizzes() কল করে                           │
└────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  backend/controllers/quizController.js - getFilteredQuizzes()              │
│  ├── ফিল্টার অবজেক্ট তৈরি: { categoryInfo.board, categoryInfo.class, ... }   │
│  └── Question.find(filter) → ডেটাবেসে কোয়েরি পাঠায়                         │
└────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  MongoDB - questions collection                                             │
│  ├── ফিল্টার অনুযায়ী প্রশ্ন খুঁজে                                                 │
│  └── ম্যাচিং প্রশ্নগুলোর অ্যারে রিটার্ন করে                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  ডেটা ফিরে আসে: JSON Response                                             │
│  { success: true, count: 10, data: [question1, question2, ...] }           │
└────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  frontend/js/pages/quiz.js - #startQuizWithFilters()                       │
│  ├── API রেসপন্স প্রক্রিয়া করে                                                 │
│  ├── QuizEngine তৈরি করে (নতুন instance)                                   │
│  ├── QuizEngine: প্রশ্ন ডেটা লোড করে                                         │
│  └── #renderCurrentQuestion() কল করে                                      │
└────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  QuizEngine (frontend/js/core/QuizEngine.js)                               │
│  ├── প্রশ্ন ডেটা প্রস্তুত করে (shuffle, assign serial)                           │
│  ├── ProgressTracker তৈরি করে                                              │
│  ├── ScoreManager তৈরি করে                                                 │
│  ├── Timer তৈরি করে (perQuestion / full mode)                              │
│  └── ইভেন্ট সিস্টেম সেটআপ করে                                              │
└────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  Renderer (frontend/js/renderers/)                                        │
│  ├── প্রশ্নের টাইপ অনুযায়ী Renderer নির্বাচন                                    │
│  │   ├── MCQ → MCQRenderer                                                │
│  │   ├── Blank → BlankRenderer                                            │
│  │   └── Rearranging → RearrangingRenderer                                │
│  └── প্রশ্ন UI তে রেন্ডার করে                                                 │
└───────────────────────────────────────────────────────────────────────────┘

🔄 ৩. প্রশ্ন উত্তর দেওয়ার ডেটা-ফ্লো:
[১] ইউজার অপশন সিলেক্ট করে
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Renderer (MCQ/Blank/Rearranging)                                          │
│  ├── ইউজারের উত্তর ক্যাপচার করে                                             │
│  └── QuizEngine.answerQuestion() কল করে                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  QuizEngine - answerQuestion()                                             │
│  ├── সঠিক/ভুল চেক করে                                                     │
│  ├── ScoreManager.addScore() (সঠিক হলে)                                   │
│  ├── প্রশ্নের স্ট্যাটাস আপডেট করে (correct/wrong)                              │
│  └── 'questionAnswered' ইভেন্ট ইমিট করে                                    │
└────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  QuizPage - #updateUI()                                                    │
│  ├── স্কোর বোর্ড আপডেট করে                                                 │
│  ├── প্রগ্রেস বার আপডেট করে                                                 │
│  └── মেটা ইনফো আপডেট করে                                                │
└────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  সব প্রশ্ন শেষ হলে → #showResults()                                          │
│  ├── QuizEngine.getResults() কল করে                                       │
│  ├── রেজাল্ট UI তে দেখায়                                                    │
│  └── (যদি ১০০% হয়) storageService.incrementTimesHundred()                 │
└────────────────────────────────────────────────────────────────────────────┘

🔄 ৪. একাডেমিয়া ডেটা-ফ্লো:
[১] ইউজার "Academia" কার্ডে ক্লিক করে
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  WelcomePage → navigation.navigateTo('academia')                            │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AcademiaPage - শ্রেণি গ্রিড রেন্ডার করে                                         │
│  ├── CLASS_DATA থেকে ডেটা দেখায়                                             │
│  └── ইউজার একটি শ্রেণি সিলেক্ট করে                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AcademiaPage - renderSubjects()                                            │
│  ├── SUBJECT_DATA থেকে বিষয় দেখায়                                           │
│  └── ইউজার একটি বিষয় সিলেক্ট করে                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AcademiaPage - renderChapters()                                            │
│  ├── CHAPTER_DATA থেকে অধ্যায় দেখায়                                          │
│  └── ইউজার একটি অধ্যায় সিলেক্ট করে                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AcademiaPage - renderContent()                                             │
│  ├── contentMap থেকে HTML ফাইলের পাথ খুঁজে                                  │
│  ├── fetch() দিয়ে HTML ফাইল লোড করে                                       │
│  └── content-body এ HTML বসায় + KaTeX রেন্ডার করে                            │
└─────────────────────────────────────────────────────────────────────────────┘

🔄 ৫. ডেটা স্টোরেজ ফ্লো (লোকাল স্টোরেজ):
┌─────────────────────────────────────────────────────────────────────────────┐
│                    StorageService.js - ডেটা সংরক্ষণ                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┬─────────────────────┬─────────────────────────────────────┐
│      Key        │       Value         │              Used In                │
├─────────────────┼─────────────────────┼─────────────────────────────────────┤
│ user_selected   │ 60 (number)         │ timeSlider (প্রতি প্রশ্নের সময়)         │
│ _time           │                     │                                     │
├─────────────────┼─────────────────────┼─────────────────────────────────────┤
│ user_dark_mode  │ '1' or '0'         │ darkModeToggle (ডার্ক মোড)            │
├─────────────────┼─────────────────────┼─────────────────────────────────────┤
│ user_profile    │ { name, email,     │ profileName, avatar, org, class,     │
│                 │   org, class,      │ section, board                       │
│                 │   section, board,  │                                      │
│                 │   avatarDataUrl }  │                                      │
├─────────────────┼─────────────────────┼─────────────────────────────────────┤
│ user_times_     │ 5 (number)         │ profileTimesHundred (১০০% কাউন্ট)     │
│ hundred         │                     │                                     │
├─────────────────┼─────────────────────┼─────────────────────────────────────┤
│ user_leader     │ [{ name, score,    │ leaderboardList (লিডারবোর্ড)          │
│ board           │   date }]          │                                      │
├─────────────────┼─────────────────────┼─────────────────────────────────────┤
│ user_full_      │ '1' or '0'         │ fullTimerCheckbox (ফুল টাইমার)        │
│ timer_mode      │                     │                                     │
├─────────────────┼─────────────────────┼─────────────────────────────────────┤
│ user_auth_token │ <jwt_token>        │ API অথেনটিকেশন                     │
├─────────────────┼─────────────────────┼─────────────────────────────────────┤
│ user_quiz_      │ { quiz,            │ quizProgress (কুইজ প্রগ্রেস)           │
│ progress        │   currentIndex,    │                                     │
│                 │   score,           │                                     │
│                 │   timestamp }      │                                     │
└─────────────────┴─────────────────────┴─────────────────────────────────────┘

🔄 ৬. ডেটা সোর্স সমূহ:
  ডেটা সোর্স	          অবস্থান	                     বর্ণনা
Static Data	        mainQuizData.js	       সব কুইজ প্রশ্নের ডেটা (জাভাস্ক্রিপ্ট অবজেক্ট)
Category Index	    assortedData.js	       ক্যাটাগরি ব্রাউজিং ইনডেক্স
Content HTML	    frontend/content/	   একাডেমিয়া কন্টেন্ট ফাইল
API Data	        backend/ → MongoDB	   ডায়নামিক ডেটা (User, Quiz)
Local Storage   	Browser Storage	       ইউজার সেটিংস, প্রোফাইল, প্রগ্রেস


🎯 সংক্ষিপ্ত ডেটা-ফ্লো সারাংশ:

ক্রম  অ্যাকশন	         ডেটা উৎস        গন্তব্য
1	ওয়েলকাম পেজ      Static HTML	      Browser
2	ফিল্টার লোড	       API → MongoDB	   ফ্রন্টএন্ড
3	কুইজ শুরু	       API → MongoDB	   QuizEngine
4	প্রশ্ন উত্তর	       User Input	       ScoreManager
5	রেজাল্ট দেখান	    QuizEngine	        UI
6	স্কোর সেভ	        StorageService	    Local Storage
7	একাডেমিয়া ব্রাউজ	 Static JSON	     UI
8	কন্টেন্ট লোড	    Static HTML	        UI



## শুরু করার নির্দেশনা
```bash
# ডিপেন্ডেন্সি ইনস্টল
npm install

# ডেভেলপমেন্ট সার্ভার চালু
npm run dev

# প্রোডাকশন সার্ভার চালু
npm start

গুরুত্বপূর্ণ লিঙ্ক
কন্টেন্ট যোগ করার গাইড

অধ্যায় যোগ করার গাইড

শ্রেণি যোগ করার গাইড 

---

### **২. `docs/guides/adding-content.md`** - কন্টেন্ট যোগ করার গাইড

```markdown
# 📄 নতুন কন্টেন্ট যোগ করার গাইড

## ধাপ ১: HTML ফাইল তৈরি করুন
`frontend/content/[CLASS]/[SUBJECT]/[CHAPTER]/[FILE_NAME].html`

### উদাহরণ: frontend/content/HSC/math/3A/new-topic.html


### HTML ফাইলের প্রয়োজনীয় কাঠামো:
```html
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>টপিকের নাম</title>
    <link rel="stylesheet" href="../../../../css/styles_math_sol.css">
    <link rel="stylesheet" href="../../../../katex/katex.min.css">
    <script defer src="../../../../katex/katex.min.js"></script>
    <script defer src="../../../../katex/contrib/auto-render.min.js"></script>
</head>
<body>
    <div class="container">
        <!-- আপনার কন্টেন্ট -->
    </div>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false}
                ],
                throwOnError: false
            });
        });
    </script>
</body>
</html>



ধাপ ২: contentMap-এ যোগ করুন
frontend/js/pages/academia.js-এ:

const contentMap = {
    // ... existing ...
    'new-topic-id': {
        name: 'টপিকের নাম (ব্যাখ্যা)',
        type: 'note', // বা 'quiz'
        file: './content/HSC/math/3A/new-topic.html'
    }
};


ধাপ ৩: CHAPTER_DATA-এ যোগ করুন

const CHAPTER_DATA = {
    'your-subject-id': [
        {
            id: 'ch-X',
            number: X,
            name: 'অধ্যায়ের নাম',
            icon: '📊',
            topics: [
                // ... existing ...
                { 
                    id: 'new-topic-id', 
                    name: 'টপিকের নাম', 
                    icon: '📝', 
                    type: 'note' 
                }
            ]
        }
    ]
};


ধাপ ৪: ফাইল পাথ চেক করুন

frontend/content/HSC/math/3A/new-topic.html
                 ↑    ↑    ↑
              CLASS  SUBJECT  CHAPTER



টিপস
KaTeX ব্যবহার করতে $...$ (ইনলাইন) বা $$...$$ (ডিসপ্লে) ব্যবহার করুন

সব HTML ফাইলে KaTeX স্ক্রিপ্ট যোগ করতে ভুলবেন না

ফাইল নামে স্পেস না রাখাই ভালো (হাইফেন বা আন্ডারস্কোর ব্যবহার করুন)



---

### **৩. `docs/guides/adding-chapters.md`** - অধ্যায় যোগ করার গাইড

```markdown
# 📑 নতুন অধ্যায় যোগ করার গাইড

## ধাপ ১: অধ্যায় ডেটা তৈরি করুন
`frontend/js/pages/academia.js`-এ CHAPTER_DATA আপডেট করুন:

```javascript
const CHAPTER_DATA = {
    'subject-id': [
        // ... existing chapters ...
        {
            id: 'ch-new',           // ইউনিক আইডি
            number: 5,              // অধ্যায় নম্বর
            name: 'অধ্যায়ের নাম',   // প্রদর্শনের নাম
            icon: '📊',             // আইকন
            topics: [
                { 
                    id: 'topic-1', 
                    name: 'টপিক ১', 
                    icon: '📝', 
                    type: 'note' 
                },
                { 
                    id: 'topic-2', 
                    name: 'টপিক ২', 
                    icon: '✅', 
                    type: 'note' 
                }
            ]
        }
    ]
};



ধাপ ২: বিষয় ডেটা আপডেট করুন
যদি নতুন বিষয় হয়, তাহলে SUBJECT_DATA আপডেট করুন:

const SUBJECT_DATA = {
    'class-id': [
        // ... existing subjects ...
        {
            id: 'subject-id',
            name: 'বিষয়ের নাম',
            icon: '📐',
            chapters: 10  // মোট অধ্যায় সংখ্যা
        }
    ]
};


ধাপ ৩: কন্টেন্ট ফাইল তৈরি করুন
প্রতিটি টপিকের জন্য আলাদা HTML ফাইল তৈরি করুন:
frontend/content/HSC/math/ch-new/
├── topic-1.html
└── topic-2.html


ধাপ ৪: contentMap আপডেট করুন

const contentMap = {
    // ... existing ...
    'topic-1': {
        name: 'টপিক ১ - বিবরণ',
        type: 'note',
        file: './content/HSC/math/ch-new/topic-1.html'
    },
    'topic-2': {
        name: 'টপিক ২ - বিবরণ',
        type: 'note',
        file: './content/HSC/math/ch-new/topic-2.html'
    }
};


ফাইল পাথ ক্যালকুলেশন
frontend/content/[CLASS]/[SUBJECT]/[CHAPTER]/
                 ↑         ↑          ↑
              শ্রেণি     বিষয়     অধ্যায়


উদাহরণ: HSC উচ্চতর গণিত অধ্যায় 4 যোগ করা
// CHAPTER_DATA-তে যোগ করুন
'hmath-11': [
    // ... 3A, 3B ...
    {
        id: 'ch-4',
        number: 4,
        name: 'বীজগাণিতিক রাশি (অনুশীলনী ৪)',
        icon: '🔢',
        topics: [
            { id: '4A-All-Q', name: 'সকল প্রশ্ন', icon: '📝', type: 'note' }
        ]
    }
]

// contentMap-এ যোগ করুন
'4A-All-Q': {
    name: 'বীজগাণিতিক রাশি - সকল প্রশ্ন',
    type: 'note',
    file: './content/HSC/math/4A/4A All Q.html'
}



---

### **৪. `docs/guides/adding-classes.md`** - শ্রেণি যোগ করার গাইড

```markdown
# 🏫 নতুন শ্রেণি যোগ করার গাইড

## ধাপ ১: CLASS_DATA আপডেট করুন
`frontend/js/pages/academia.js`-এ:

```javascript
const CLASS_DATA = [
    // ... existing classes ...
    {
        id: 'class-new',                    // ইউনিক আইডি
        name: 'নতুন শ্রেণির নাম',            // প্রদর্শনের নাম
        icon: '📘',                         // আইকন
        subjects: ['বিষয়১', 'বিষয়২', 'বিষয়৩']  // বিষয়ের তালিকা
    }
];



ধাপ ২: SUBJECT_DATA আপডেট করুন

const SUBJECT_DATA = {
    // ... existing ...
    'class-new': [
        {
            id: 'subject-1',
            name: 'বিষয় ১',
            icon: '📐',
            chapters: 10
        },
        {
            id: 'subject-2',
            name: 'বিষয় ২',
            icon: '🔬',
            chapters: 8
        }
    ]
};


ধাপ ৩: CHAPTER_DATA আপডেট করুন

const CHAPTER_DATA = {
    // ... existing ...
    'subject-1': [
        {
            id: 'ch-1',
            number: 1,
            name: 'অধ্যায় ১',
            icon: '📊',
            topics: [
                { id: 'topic-1', name: 'টপিক ১', icon: '📝', type: 'note' }
            ]
        }
    ]
};


ধাপ ৪: কন্টেন্ট ফোল্ডার তৈরি করুন
frontend/content/NEW_CLASS/
└── subject-1/
    └── ch-1/
        └── topic-1.html


ধাপ ৫: contentMap আপডেট করুন
const contentMap = {
    // ... existing ...
    'topic-1': {
        name: 'টপিক ১ - বিবরণ',
        type: 'note',
        file: './content/NEW_CLASS/subject-1/ch-1/topic-1.html'
    }
};

উদাহরণ: SSC 2028 যোগ করা

// CLASS_DATA
{ id: 'ssc-2028', name: 'SSC 2028', icon: '🎯', subjects: ['গণিত', 'বাংলা', 'ইংরেজি'] }

// SUBJECT_DATA
'ssc-2028': [
    { id: 'math-ssc28', name: 'গণিত', icon: '📐', chapters: 12 }
]

// CHAPTER_DATA
'math-ssc28': [
    {
        id: 'ch-1',
        number: 1,
        name: 'সেট ও ফাংশন',
        icon: '📊',
        topics: [
            { id: 'set-1', name: 'সেটের ধারণা', icon: '📝', type: 'note' }
        ]
    }
]




---

### **৫. `docs/guides/folder-structure.md`** - ফোল্ডার স্ট্রাকচার ব্যাখ্যা

```markdown
# 📁 ফোল্ডার স্ট্রাকচার গাইড

## সম্পূর্ণ ফোল্ডার স্ট্রাকচার
quiz_program/
│
├── backend/ # ব্যাকএন্ড সার্ভার
│ ├── config/ # কনফিগারেশন
│ │ ├── constants.js # কনস্ট্যান্ট
│ │ └── db.js # ডাটাবেস কানেকশন
│ ├── controllers/ # কন্ট্রোলার
│ │ ├── authController.js # অথেনটিকেশন
│ │ └── quizController.js # কুইজ লজিক
│ ├── middleware/ # মিডলওয়্যার
│ │ ├── authMiddleware.js
│ │ └── errorMiddleware.js
│ ├── models/ # ডেটাবেস মডেল
│ │ ├── Question.js
│ │ ├── Structure.js
│ │ └── User.js
│ ├── routes/ # API রাউট
│ │ ├── authRoutes.js
│ │ ├── categoryRoutes.js
│ │ └── quizRoutes.js
│ ├── seed/ # ডামি ডেটা
│ │ └── seeder.js
│ ├── utils/ # ইউটিলিটি
│ │ ├── appError.js
│ │ └── catchAsync.js
│ └── server.js # এন্ট্রি পয়েন্ট
│
├── frontend/ # ফ্রন্টএন্ড
│ ├── content/ # 📁 কন্টেন্ট ফাইল (HTML)
│ │ ├── HSC/ # শ্রেণি
│ │ │ ├── math/ # বিষয়
│ │ │ │ ├── 3A/ # অধ্যায়
│ │ │ │ │ └── *.html # টপিক ফাইল
│ │ │ │ └── 3B/
│ │ │ ├── physics/
│ │ │ └── chemistry/
│ │ ├── SSC/
│ │ └── class-9-10/
│ │
│ ├── css/ # স্টাইল শীট
│ │ ├── academia.css # একাডেমিয়া পেজ
│ │ ├── components.css # কম্পোনেন্ট
│ │ ├── dark-mode.css # ডার্ক মোড
│ │ ├── main.css # মেইন স্টাইল
│ │ ├── quiz.css # কুইজ স্টাইল
│ │ ├── styles_math_sol.css # গণিত কন্টেন্ট
│ │ └── welcome.css # ওয়েলকাম পেজ
│ │
│ ├── js/ # জাভাস্ক্রিপ্ট
│ │ ├── core/ # কোর লজিক
│ │ │ ├── ProgressTracker.js
│ │ │ ├── QuizEngine.js
│ │ │ ├── ScoreManager.js
│ │ │ └── Timer.js
│ │ ├── pages/ # পেজ লজিক
│ │ │ ├── academia.js # ⭐ একাডেমিয়া
│ │ │ ├── quiz.js
│ │ │ └── welcome.js
│ │ ├── renderers/ # রেন্ডারার
│ │ │ ├── BaseRenderer.js
│ │ │ ├── BlankRenderer.js
│ │ │ ├── MCQRenderer.js
│ │ │ └── RearrangingRenderer.js
│ │ ├── services/ # সার্ভিস
│ │ │ ├── ApiService.js
│ │ │ └── StorageService.js
│ │ ├── utils/ # ইউটিলিটি
│ │ │ ├── constants.js
│ │ │ └── logger.js
│ │ └── app.js # মেইন এন্ট্রি
│ │
│ ├── katex/ # KaTeX ফাইল (ঐচ্ছিক)
│ │ ├── katex.min.css
│ │ ├── katex.min.js
│ │ └── contrib/
│ │ └── auto-render.min.js
│ │
│ └── index.html # মেইন HTML
│
├── docs/ # 📁 ডকুমেন্টেশন
│ ├── README.md
│ ├── guides/
│ │ ├── adding-content.md
│ │ ├── adding-chapters.md
│ │ └── adding-classes.md
│ └── ...
│
├── .env # এনভায়রনমেন্ট
├── assortedData.js # ক্যাটাগরি ডেটা
├── mainQuizData.js # কুইজ ডেটা
├── package.json
└── package-lock.json


## গুরুত্বপূর্ণ ফাইলসমূহ

| ফাইল | বর্ণনা | অবস্থান |
|------|--------|---------|
| `academia.js` | একাডেমিয়া পেজের মূল লজিক | `frontend/js/pages/` |
| `contentMap` | HTML ফাইলের পাথ ম্যাপিং | `academia.js`-এর ভিতরে |
| `CHAPTER_DATA` | অধ্যায় ও টপিক ডেটা | `academia.js`-এর ভিতরে |
| `CLASS_DATA` | শ্রেণি ডেটা | `academia.js`-এর ভিতরে |
| `SUBJECT_DATA` | বিষয় ডেটা | `academia.js`-এর ভিতরে |
| HTML ফাইল | কন্টেন্ট ফাইল | `frontend/content/` |

## পাথ ক্যালকুলেশন টেবিল

| অবস্থান | পাথ | স্তর |
|---------|-----|------|
| 3A HTML → CSS | `../../../../css/` | 4 স্তর উপরে |
| 3A HTML → katex | `../../../../katex/` | 4 স্তর উপরে |
| academia.js → content | `./content/` | বর্তমান ফোল্ডার থেকে |

## নতুন ফাইল যোগ করার নিয়ম

1. **HTML ফাইল**: `frontend/content/[CLASS]/[SUBJECT]/[CHAPTER]/[FILE].html`
2. **CSS ফাইল**: `frontend/css/[FILE].css`
3. **JS ফাইল**: `frontend/js/pages/[FILE].js`



