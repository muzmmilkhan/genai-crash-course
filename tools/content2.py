
QUIZZES = {
 "genai-basics": [
  ("Which best describes generative AI?", ["AI that only classifies data", "AI that creates new content such as text, images or code", "AI that stores databases", "AI that only works offline"], 1, "Generative AI produces new content. Predictive AI mostly classifies or forecasts."),
  ("Which statement about GenAI output is wisest?", ["It is always correct", "It is a helpful draft that should be checked", "It never makes mistakes with numbers", "It only needs checking for images"], 1, "GenAI can sound confident while being wrong, so verify anything important."),
  ("How do AI, machine learning and GenAI relate?", ["They are unrelated", "GenAI is a part of deep learning, which is part of ML, which is part of AI", "AI is a part of GenAI", "ML is a part of GenAI"], 1, "Think of nested circles: AI contains ML, which contains deep learning, which contains GenAI."),
 ],
 "llm-how": [
  ("What is a token?", ["A password", "A small piece of text the model reads", "A GPU core", "A full document"], 1, "Models read tokens, often words or word pieces. Limits and prices are counted in tokens."),
  ("What does attention let a model do?", ["Store files", "Decide which other words matter for understanding a word", "Speed up the internet", "Translate to binary"], 1, "Attention weighs how relevant each other token is, for example linking \"it\" to \"animal\"."),
  ("What does a higher temperature do?", ["Makes output more varied and creative", "Makes output more accurate", "Makes the answer shorter", "Turns off randomness"], 0, "Higher temperature flattens the probabilities, so less likely tokens appear more often."),
 ],
 "prompting": [
  ("Which prompt is best?", ["Fix this", "Write something about sales", "Explain this KeyError on line 12 in simple terms for a beginner, in 3 bullets", "Help"], 2, "It states the problem, audience and format."),
  ("What is few-shot prompting?", ["Asking short questions", "Showing a few examples of the desired output", "Using a small model", "Limiting the number of replies"], 1, "Examples teach the pattern you want."),
  ("If the first answer is off, a good next step is to...", ["Start over with a new chat", "Reply with what to change", "Give up", "Increase font size"], 1, "Iterate: tell the AI exactly what to adjust."),
 ],
 "rag": [
  ("What problem does RAG solve?", ["Slow internet", "Models not knowing your private or recent information", "Making images larger", "Reducing electricity use"], 1, "RAG retrieves relevant documents and gives them to the model so it answers from facts."),
  ("In RAG, what is stored in the vector database?", ["Only passwords", "Embeddings of document chunks", "The model weights", "User photos"], 1, "Each chunk is stored as an embedding so similar meanings can be found quickly."),
  ("Why not use one giant chunk for everything?", ["It is illegal", "Important details get diluted and retrieval is less precise", "Chunks must be 10 words", "Vectors cannot be large"], 1, "Right-sized chunks give focused context."),
 ],
 "agents": [
  ("What makes an agent different from a chatbot?", ["It uses colors", "It can plan steps and use tools to act", "It is always offline", "It never uses an LLM"], 1, "Agents loop through think, act and observe using tools."),
  ("Who actually runs a tool the model asks for?", ["The model itself", "The application around the model", "The user's browser only", "Nobody"], 1, "The model requests; your software executes and returns the result."),
  ("A safe agent design includes...", ["Full access to everything", "Least privilege and human approval for risky actions", "No logging", "Hidden actions"], 1, "Limit access, keep humans in control, and log actions."),
 ],
 "app-architecture": [
  ("Why does a long chat cost more per turn?", ["Tokens expire", "The whole history is re-sent each turn", "The model is tired", "Output is free"], 1, "Context grows, and it is re-processed on every turn."),
  ("What is the job of guardrails?", ["Make the app prettier", "Check inputs and outputs for unsafe or off-topic content", "Compress files", "Store vectors"], 1, "Guardrails filter and constrain behavior."),
  ("How should you pick a model?", ["Always the biggest", "Match quality, speed and cost to the task and test it", "Whichever is newest", "Random"], 1, "Test on your own examples and move to a cheaper model if quality holds."),
 ],
 "safety": [
  ("What is a hallucination?", ["A slow response", "A fluent answer that is false or invented", "A server error", "An image filter"], 1, "Models can produce convincing but made-up content."),
  ("Which is safest?", ["Pasting customer data into any free chatbot", "Using made-up sample data when practising", "Sharing passwords to get help", "Uploading confidential files to unapproved tools"], 1, "Use anonymized or fake data unless the tool is approved for sensitive data."),
  ("What is prompt injection?", ["Typing fast", "Hidden instructions in content that try to hijack the AI", "Adding more tokens", "Compressing prompts"], 1, "Treat outside content as data, not instructions, and limit what the AI can do."),
 ],
}

GLOSSARY = [
 ("AI", "Software that performs tasks that normally need human intelligence, like understanding language or recognizing images."),
 ("Machine learning", "A way of building AI by learning patterns from data instead of writing every rule by hand."),
 ("Deep learning", "Machine learning that uses large neural networks with many layers."),
 ("Generative AI", "AI that creates new content such as text, images, audio, video or code."),
 ("LLM", "Large language model: a model trained on huge amounts of text to predict and generate language."),
 ("Token", "A small piece of text (word or part of a word) that a model reads and writes."),
 ("Embedding", "A list of numbers that represents the meaning of a token, sentence or image."),
 ("Transformer", "The neural network design behind most modern LLMs, built around attention."),
 ("Attention", "A mechanism that lets the model weigh which other words matter when processing a word."),
 ("Context window", "The maximum amount of text (in tokens) a model can consider at once."),
 ("Prompt", "The input you give an AI: instructions, context, examples and your question."),
 ("Few-shot prompting", "Including a few examples in the prompt to show the pattern you want."),
 ("Temperature", "A setting that controls randomness: low is predictable, high is more varied."),
 ("Hallucination", "A confident, fluent answer that is false or made up."),
 ("Fine-tuning", "Further training a model on specific examples to specialize its behavior."),
 ("RAG", "Retrieval-augmented generation: fetch relevant documents first, then have the model answer from them."),
 ("Vector database", "A database that stores embeddings and finds the most similar ones quickly."),
 ("Chunk", "A small piece of a document prepared for indexing and retrieval."),
 ("Agent", "An AI that plans steps and uses tools to complete a goal."),
 ("Tool use", "Letting a model request actions such as search, calculation or API calls, which the app then runs."),
 ("MCP", "Model Context Protocol: an open standard for connecting AI apps to tools and data."),
 ("Guardrails", "Checks and limits that keep an AI app's inputs and outputs safe and on-topic."),
 ("Prompt injection", "Hidden instructions in content that try to hijack an AI's behavior."),
 ("Multimodal", "A model that can work with more than one kind of data, like text and images."),
 ("Inference", "Running a trained model to get an answer."),
 ("Latency", "How long you wait for a response."),
 ("Benchmark / eval", "A set of tests used to measure how well a model or app performs."),
]

GLOSS_PAGE = dict(key="glossary", title="Glossary & Flashcards", tag="Reference", color="#007aff",
 intro="Plain-English definitions of the key GenAI terms. Flip flashcards, or search the full list.",
 sections=[("Flashcards", [("widget", "flashcards")]), ("Search the glossary", [("widget", "glossary")])])

LAB_DESIGN = dict(key="lab3-design-your-app", title="Lab 3: Design Your Own GenAI App", tag="Lab · 25 min", color="#34c759",
 intro="Apply the architecture ideas: pick a product, choose its building blocks, then explain your choices.",
 sections=[
  ("Goal", [("p", "Practise thinking like an architect. You will choose the pieces a GenAI product needs and justify each one."), ("ul", ["No coding required.", "About 25 minutes."])]),
  ("Step 1: Use the architecture builder", [
    ("widget", "archbuilder"),
    ("task", ["I tried all three product ideas.", "I got a design with no missing required blocks for at least one idea."])]),
  ("Step 2: Design your own idea", [
    ("p", "Think of a GenAI app you would like to exist. Write answers to these questions in a notes file:"),
    ("ul", ["Who is the user and what problem do they have?", "What information does the model need? Is it in its training data, or must you retrieve it?", "Does it need to take actions with tools? Which ones, and which need human approval?", "What could go wrong? List two risks and one guardrail for each.", "How will you test whether it works well?"]),
    ("task", ["I wrote a one-sentence description of the product.", "I listed the blocks I need and why.", "I listed two risks with guardrails.", "I defined three test questions."])]),
  ("Step 3: Estimate the cost", [
    ("widget", "costsim"),
    ("task", ["I estimated tokens per conversation for my idea.", "I tried the caching option and noted the savings."])]),
  ("Reflection", [("ul", ["Which block was hardest to decide on?", "Where would a human need to stay in the loop?"])]),
 ])


LAB_PROMPT = dict(key="lab1-prompt-workshop", title="Lab 1: Prompt Engineering Workshop", tag="Lab · 25 min", color="#af52de",
 intro="Five exercises that turn weak prompts into strong ones. Works in any chat assistant, and no installation is needed.",
 sections=[
  ("How to use this lab", [
    ("p", "For each exercise, run the weak prompt first and note what is wrong. Then write an improved prompt and compare. Keep your best versions in a notes file."),
    ("tip", "Do not paste confidential data into any tool that is not approved. Use made-up sample data.")]),
  ("Exercise 1: Be specific", [
    ("code", "Weak:    Write something about our product launch.\nImprove: audience, goal, length, tone, and the key facts to include."),
    ("task", ["Your prompt names an audience.", "Your prompt sets length and tone.", "The output needed no major rewrite."])]),
  ("Exercise 2: Add context and role", [
    ("code", "Weak:    Review this SQL query.\nImprove: say what the table is, expected volume, the database engine, and what to look for (performance, correctness, injection)."),
    ("task", ["You supplied the schema or a description.", "You asked for findings ordered by severity."])]),
  ("Exercise 3: Few-shot examples", [
    ("p", "Ask the assistant to classify support tickets as bug, feature or question. First with no examples, then with three examples in your preferred format."),
    ("code", "Ticket: \"App crashes when I tap Save\" -> bug\nTicket: \"Can you add dark mode?\" -> feature\nTicket: \"How do I export my data?\" -> question\n\nTicket: \"The export button does nothing\" ->"),
    ("task", ["Output format matched your examples exactly.", "You tested one ambiguous ticket and refined an example."])]),
  ("Exercise 4: Structure and output format", [
    ("p", "Paste a made-up meeting transcript inside <transcript> tags and request JSON with decisions, owners and due dates."),
    ("code", "Return valid JSON only, matching:\n{\"decisions\":[{\"text\":\"\",\"owner\":\"\",\"due\":\"\"}]}"),
    ("task", ["The JSON parsed without edits.", "Missing owners were returned as an empty string rather than invented."])]),
  ("Exercise 5: Iterate with a test set", [
    ("p", "Write 5 varied inputs for one of your prompts, including two tricky ones. Change one thing at a time and track which version handles most cases."),
    ("task", ["You have a 5-case test set.", "You can state which change helped most."])]),
  ("Reflection", [("ul", ["Which element (role, examples, format, context) mattered most for you?", "Where did the model still need human verification?"])]),
 ])

LAB_RAG = dict(key="lab2-tiny-rag", title="Lab 2: Build a Tiny RAG Pipeline", tag="Lab · 30 min", color="#30b0c7",
 intro="Implement retrieval-augmented generation from scratch in about 30 lines of Python: score documents, retrieve the best ones, and build a grounded prompt.",
 sections=[
  ("What you will build", [
    ("p", "A script that takes a question, finds the most relevant snippets from a small document set using TF-IDF-style scoring, and prints a prompt you can paste into any assistant. Real systems use embeddings, but the pipeline shape is the same."),
    ("ul", ["Prerequisite: Python 3 (no packages needed).", "Tip: try the Retrieval Playground in the RAG module first to see the idea."])]),
  ("Step 1: The retriever", [
    ("p", "Save as rag.py:"),
    ("code", "import math, re\nfrom collections import Counter\n\nDOCS = {\n    \"refunds.md\": \"Customers can request a refund within 30 days of purchase. Refunds are issued to the original payment method within 5 business days.\",\n    \"shipping.md\": \"Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days and costs extra.\",\n    \"privacy.md\": \"We store account data encrypted at rest. You may request deletion of your data at any time.\",\n    \"support.md\": \"Support is available Monday to Friday, 9am to 5pm. Email support@example.com for help.\",\n}\n\ndef tokens(text):\n    return re.findall(r\"[a-z0-9]+\", text.lower())\n\nN = len(DOCS)\ndf = Counter(t for d in DOCS.values() for t in set(tokens(d)))\n\ndef score(query, doc):\n    tf = Counter(tokens(doc))\n    return sum(tf[t] * math.log((N + 1) / (df[t] + 1) + 1) for t in tokens(query))\n\ndef retrieve(query, k=2):\n    ranked = sorted(DOCS.items(), key=lambda kv: score(query, kv[1]), reverse=True)\n    return ranked[:k]"),
    ("task", ["rag.py saved.", "You can explain why rare words get a higher weight (idf)."])]),
  ("Step 2: Build a grounded prompt", [
    ("code", "def build_prompt(query):\n    ctx = \"\\n\\n\".join(f\"[{name}]\\n{text}\" for name, text in retrieve(query))\n    return (\n        \"Answer using only the context. Cite the file name. \"\n        \"If the answer is not in the context, say you don't know.\\n\\n\"\n        f\"<context>\\n{ctx}\\n</context>\\n\\nQuestion: {query}\"\n    )\n\nif __name__ == \"__main__\":\n    print(build_prompt(\"How long do I have to ask for a refund?\"))"),
    ("code", "python3 rag.py"),
    ("task", ["refunds.md is the first retrieved snippet.", "You pasted the printed prompt into an assistant and got a cited answer."])]),
  ("Step 3: Break it on purpose", [
    ("ul", ["Ask something not in the documents. Does the model say it doesn't know?", "Ask a question that uses different words than the docs (for example \"money back\"). Keyword scoring struggles here, which is where embeddings help.", "Increase k to 4. What happens to prompt size and answer focus?"])]),
  ("Where to go next", [("ul", ["Replace the scorer with embeddings and a vector index.", "Add chunking for longer documents.", "Evaluate with a test set of questions and expected sources."])]),
 ])

LABS = [LAB_PROMPT, LAB_RAG, LAB_DESIGN]
