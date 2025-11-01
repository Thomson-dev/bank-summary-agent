

# 🏦 Bank Statement Analysis Agent

An **AI-powered financial assistant** that intelligently analyzes Nigerian bank statements to deliver **personalized insights, spending analytics, and smart financial recommendations** — powered by **Mastra + Google Gemini**.

---

## ✨ Key Features

✅ Multi-Bank Support (GTB, Access Bank, UBA, Zenith Bank)
✅ Smart Transaction Categorization
✅ Income & Expense Summarization
✅ Financial Health Scoring
✅ Personalized Spending Insights
✅ Budgeting & Savings Recommendations

---

## 🏛 Supported Banks & Formats

### 💳 GTBank (GTB)

```
01-Nov-25  SALARY PAYMENT 500,000.00 CR
05-Nov-25  POS SHOPRITE LEKKI 15,000.00 DR
```

### 🏦 Access Bank

```
02-Nov-25  ATM WITHDRAWAL NGN 20,000.00 DR
03-Nov-25  TRANSFER FROM JOHN NGN 50,000.00 CR
```

### 🧾 UBA

```
02/11/2024  DSTV PAYMENT NGN 24,000.00 D
03/11/2024  SALARY CREDIT NGN 450,000.00 C
```

### 🏛 Zenith Bank

```
01-Nov-2025  SALARY NOVEMBER 550,000.00 CR
05-Nov-2025  POS TRANSACTION 25,000.00 DR
```

---

## 📊 Analysis Output

### 1️⃣ Financial Summary

* Total Income
* Total Expenses
* Net Savings
* Monthly Balance Trend

### 2️⃣ Categorized Transactions

* Salary & Income
* Bills & Utilities
* POS/ATM Withdrawals
* Food & Groceries
* Entertainment & Lifestyle
* Transportation
* Health & Others

### 3️⃣ Financial Health Indicators

* Savings Rate
* Expense Ratio
* Top Spending Categories
* Monthly Income Stability

### 4️⃣ Personalized Recommendations

* Spending optimization tips
* Savings and investment suggestions
* Risk alerts for unusual spending

---

## 💡 Usage Examples

### 🧾 Simple Format

```
01-Nov-25 SALARY PAYMENT 500,000.00 CR
05-Nov-25 POS SHOPRITE LEKKI 15,000.00 DR
```

### 💻 JSON Format

```json
[
  { "date": "2025-11-01", "description": "Salary Payment", "amount": 500000, "category": "Salary" },
  { "date": "2025-11-05", "description": "Shoprite Lekki", "amount": -15000, "category": "Shopping" }
]
```

### 📁 Full Statement Upload

* Automatically detects the bank
* Parses statement text intelligently
* Generates summarized analytics in seconds

---

## ⚙️ Tech Stack

| Component               | Technology                     |
| ----------------------- | ------------------------------ |
| **AI Engine**           | Google Gemini via Mastra       |
| **Framework**           | Mastra (Agents & Tools)        |
| **Language**            | TypeScript                     |
| **Validation**          | Zod                            |
| **Frontend (optional)** | React + Tailwind               |
| **Deployment**          | Mastra Cloud / Vercel / Render |

---

## 🧠 Project Structure

```
src/
 ├── mastra/
 │   ├── agents/
 │   │   └── bank-agent.ts      # Main AI agent logic
 │   ├── tools/
 │   │   ├── bank-parser.ts     # Extracts data from statements
 │   │   └── bank-tool.ts       # Performs analysis and summary
 └── test-bank.ts               # Test script for local analysis
```

---

## 🛠️ Setup & Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Test agent locally
pnpm run test
```

---

## 🤝 Contributing

1. Fork this repository
2. Create a new feature branch
3. Commit your changes
4. Push and open a Pull Request

---

## 📜 License

**MIT License** — you’re free to use, modify, and share this project.

---

### 🚀 Future Ideas

* Integration with **Mono** or **Okra** for live transaction sync
* Voice-based financial assistant
* Predictive budgeting (AI forecast next month’s spending)
* Daily/Weekly email reports

