# Beginner-friendly GenAI crash course. Block types: p, ul, code, tip, warn, table, task, widget ("name" or "archdiag:key").
MODULES = [
 dict(key="genai-basics", n=1, title="What is Generative AI?", tag="Start here", color="#007aff",
  intro="A friendly first look: what GenAI is, how it differs from other AI, what it can create, and where it falls short.",
  sections=[
   ("AI, machine learning and GenAI", [
     ("p","These terms are often mixed up. Think of them as circles inside circles: each one is a smaller, more specific idea."),
     ("widget","venn"),
     ("tip","Click the rings in the diagram to explore each layer.")]),
   ("What does \"generative\" mean?", [
     ("p","Traditional AI mostly recognizes or predicts: Is this email spam? Is this photo a cat? Generative AI creates something new: a paragraph, a picture, a song, or a piece of code."),
     ("table",[["Type","Question it answers","Example"],["Predictive AI","What is it? What will happen?","Spam filter, price forecast"],["Generative AI","Can you make me one?","Chatbot, image generator, code assistant"]])]),
   ("What can GenAI create?", [
     ("p","Different models handle different kinds of content, called modalities. Some modern models handle several at once (multimodal)."),
     ("widget","modalities")]),
   ("How did it learn?", [
     ("p","A model is trained in stages. First it reads a huge amount of text or images and learns patterns. Then it is taught to follow instructions and to behave helpfully and safely."),
     ("ul",["Pre-training: learn general patterns from huge datasets.","Fine-tuning: practise on examples of good answers.","Alignment: use human feedback to prefer helpful, honest and safe answers.","Deployment: people use it through apps and APIs."])]),
   ("Where you already meet GenAI", [
     ("ul",["Chat assistants that answer questions and draft emails.","Code helpers that suggest and explain code.","Image tools that turn a sentence into a picture.","Meeting tools that summarize calls.","Search that writes a short answer above the links."])]),
   ("Strengths and limits", [
     ("table",[["Good at","Be careful with"],["Drafting, rewriting, summarizing","Facts it cannot know or look up (it may make things up)"],["Explaining ideas at different levels","Math and logic without tools"],["Brainstorming and options","Anything where a mistake is costly and unchecked"],["Translating and reformatting","Private or sensitive data in unapproved tools"]]),
     ("warn","GenAI sounds confident even when it is wrong. Treat its output as a helpful first draft that you check.")]),
   ("Key terms: flashcards", [
     ("p","Test yourself on the vocabulary. Click a card to flip it."),
     ("widget","flashcards")]),
  ]),
 dict(key="llm-how", n=2, title="How LLMs Work", tag="Core idea", color="#5856D6",
  intro="Look inside a large language model: tokens, embeddings, attention, and how it writes one word at a time.",
  sections=[
   ("The big picture", [
     ("p","A large language model (LLM) is a very big pattern-completion machine. Given some text, it predicts what text is most likely to come next, then repeats."),
     ("p","Below is the architecture of a typical LLM. Click any box to learn what it does, or press the play button to follow your text through the model."),
     ("widget","archdiag:llmarch")]),
   ("Step 1: Tokens", [
     ("p","The model cannot read letters or words directly. Text is chopped into small pieces called tokens, and each token gets a number."),
     ("ul",["A token is often a word or part of a word.","About 4 characters, or three-quarters of an English word, per token.","Usage, limits and prices are measured in tokens."]),
     ("widget","tokenizer")]),
   ("Step 2: Embeddings, words as coordinates", [
     ("p","Each token number is turned into a long list of numbers called an embedding. Words with similar meanings get similar numbers, so they sit near each other, like cities on a map."),
     ("p","This is why a search can find \"automobile\" when you type \"car\"."),
     ("tip","The real space has hundreds or thousands of dimensions. This demo squashes it to 3.")]),
   ("Step 3: Attention, what should I focus on?", [
     ("p","To understand a word, the model looks at the other words around it and decides which ones matter. This is called attention. In \"The animal didn't cross the street because it was too tired\", the word \"it\" refers to the animal, and attention helps the model work that out."),
     ("widget","attention")]),
   ("Step 4: Choosing the next word", [
     ("p","At the end, the model gives a probability to every possible next token. Then one is picked. A setting called temperature controls how adventurous the pick is."),
     ("widget","sampler")]),
   ("Context window: the model's short-term memory", [
     ("p","The model can only consider a limited amount of text at once, called the context window. It includes your prompt, the conversation so far, any documents you add, and the answer it is writing."),
     ("warn","If something is outside the window, the model cannot see it. In long chats, early details can be forgotten.")]),
   ("Limits to remember", [
     ("ul",["It predicts likely text. It does not \"know\" things the way people do.","It can invent facts (hallucination).","It only knows what was in its training data, up to a cutoff date, unless you give it fresh information.","The same question can get slightly different answers."])]),
  ]),
 dict(key="prompting", n=3, title="Prompting Basics", tag="Hands-on", color="#af52de",
  intro="Learn to ask clearly. Good prompts are the cheapest way to get better results from any GenAI tool.",
  sections=[
   ("What is a prompt?", [
     ("p","A prompt is the message you give the AI. It can include instructions, background, examples, and the format you want. Think of it as briefing a smart new colleague who knows nothing about your situation.")]),
   ("Rule 1: Be specific", [
     ("table",[["Vague","Specific"],["Write about our product","Write a 100-word announcement of our new budgeting app for college students. Friendly tone."],["Explain this error","I get a KeyError on line 12 when the input is empty. Explain why in simple terms."]]),
     ("widget","promptfix")]),
   ("Rule 2: Give context and a role", [
     ("p","Say who the answer is for and what situation you are in. A short role such as \"You are a patient math tutor\" changes tone and depth."),
     ("code","You are a patient math tutor for 12-year-olds.\nExplain fractions using pizza examples. Keep it under 120 words.")]),
   ("Rule 3: Show examples", [
     ("p","Showing 2-3 examples of what you want is often better than describing it. This is called few-shot prompting."),
     ("code","Rewrite each sentence to be friendlier.\n\nInput: Send the report now.\nOutput: Could you send the report when you have a moment? Thanks!\n\nInput: You made a mistake.\nOutput:")]),
   ("Rule 4: Ask for a format", [
     ("ul",["Bullet list, table, steps, or JSON.","A length limit such as \"under 80 words\".","A tone such as \"friendly\" or \"formal\"."])]),
   ("Rule 5: Let it think, then iterate", [
     ("p","For tricky questions, ask for step-by-step reasoning. If the first answer is not right, reply with what to change instead of starting over."),
     ("code","Think through this step by step, then give the final answer on its own line.")]),
   ("Try it: Prompt builder", [
     ("p","Switch layers on and off to see how a prompt grows and how the response gets better."),
     ("widget","promptbuilder")]),
   ("Common mistakes", [
     ("ul",["Asking for too many things at once.","Assuming the AI knows your context.","Not checking the facts in the answer.","Pasting private or confidential data into tools you are not approved to use."])]),
  ]),
 dict(key="rag", n=4, title="Grounding & RAG", tag="Architecture", color="#30b0c7",
  intro="How to make an AI answer from your own documents instead of guessing, using retrieval-augmented generation (RAG).",
  sections=[
   ("The problem: models guess", [
     ("p","A model knows only what it learned in training. It does not know your company handbook, last week's news, or your private files. If you ask, it may confidently guess."),
     ("p","Grounding means giving the model the right information at question time so it can answer from facts. RAG is the most popular way to do that.")]),
   ("RAG architecture", [
     ("p","RAG has two parts: an offline part that prepares your documents, and an online part that answers questions. Click a box to learn more, or follow a question through the system."),
     ("widget","archdiag:ragarch")]),
   ("Finding the right pieces: vector search", [
     ("p","Every chunk of your documents is turned into an embedding (a list of numbers). Your question is too. The system finds the chunks that are closest to your question in this \"meaning space\"."),
     ("tip","Red lines connect your question to the three nearest chunks.")]),
   ("Try it: Chunking", [
     ("p","Documents are split into chunks before indexing. Small chunks lose context; huge chunks dilute the answer. Experiment with sizes."),
     ("widget","chunker")]),
   ("Try it: Retrieval playground", [
     ("p","Ask a question and watch each document get a relevance score. Turn on semantic mode to see how meaning-based search handles synonyms."),
     ("widget","retrieval")]),
   ("Making RAG better", [
     ("ul",["Split on natural boundaries such as headings and paragraphs.","Combine keyword and meaning-based search (hybrid search).","Ask the model to cite sources and say \"I don't know\" when the answer is missing.","Test with real questions and check that the right chunk is found."])]),
  ]),
 dict(key="agents", n=5, title="AI Agents & Tools", tag="Architecture", color="#ff9500",
  intro="From chatbots to assistants that can act: how agents plan, use tools and check their own work.",
  sections=[
   ("From chatbot to agent", [
     ("p","A chatbot answers. An agent acts. It is an LLM that can decide on steps, use tools such as search or a calculator, look at the results, and keep going until the task is done."),
     ("widget","archdiag:agentarch")]),
   ("The agent loop", [
     ("p","Agents repeat a simple loop: think about what to do, act using a tool, observe the result. Step through a small example."),
     ("widget","agentstep")]),
   ("Tools: how an AI does things", [
     ("p","A tool is a function the model can ask to run: search the web, query a database, send an email, run code. You describe each tool to the model, the model asks for it, and your software runs it and returns the result."),
     ("ul",["The model never runs the tool itself; the app does.","Good tool descriptions help the model choose well.","Each tool is also a risk: limit what it can do."]),
     ("tip","The agent in this 3D view chooses between several tools. Drag to rotate it.")]),
   ("Standard connectors: MCP", [
     ("p","The Model Context Protocol (MCP) is an open standard for connecting AI apps to tools and data. Like a universal plug, it lets one tool work with many AI apps.")]),
   ("Workflows vs agents", [
     ("table",[["Workflow","Agent"],["Steps are fixed by code","The model chooses the steps"],["Predictable and cheap","Flexible but less predictable"],["Good for routine tasks","Good for open-ended tasks"]]),
     ("tip","Start with the simplest design that works. Add autonomy only when you need it.")]),
   ("Keeping agents safe", [
     ("ul",["Give the least access needed.","Ask a human to approve risky actions such as deleting or paying.","Log what the agent did.","Test on safe data first."])]),
  ]),
 dict(key="app-architecture", n=6, title="Architecture of a GenAI App", tag="Architecture", color="#34c759",
  intro="Put the pieces together: the typical building blocks of a real GenAI product, and how to choose, price and measure them.",
  sections=[
   ("A reference architecture", [
     ("p","Most GenAI products share the same building blocks. Click each layer to see its job, or follow one request from the user to the answer."),
     ("widget","archdiag:apparch")]),
   ("Try it: Design your own", [
     ("p","Pick a product idea and choose the building blocks it needs. The checker tells you what you missed and what is unnecessary."),
     ("widget","archbuilder")]),
   ("Choosing a model", [
     ("p","Models trade off quality, speed and cost. Bigger models are usually smarter and slower; smaller ones are quick and cheap. Match the model to the task."),
     ("widget","modelpick")]),
   ("What does it cost?", [
     ("p","You pay per token, for both what you send and what comes back. In a chat, the whole history is re-sent every turn, so long conversations cost more than you might expect."),
     ("widget","costsim")]),
   ("Speed and caching", [
     ("ul",["Streaming shows words as they are produced, so it feels faster.","Caching reuses answers or repeated prompt parts at lower cost.","Smaller models and shorter prompts reduce latency."])]),
   ("Measuring quality", [
     ("p","You cannot improve what you do not measure. Build a small test set of realistic questions with known good answers, and re-run it whenever you change the prompt, model or data."),
     ("ul",["Check accuracy, helpfulness, tone and safety.","Log real usage (without storing sensitive data you do not need).","Get user feedback with a simple thumbs up or down."])]),
  ]),
 dict(key="safety", n=7, title="Safety & Responsible Use", tag="Essential", color="#ff3b30",
  intro="Use GenAI confidently and carefully: hallucinations, privacy, bias, prompt injection and good habits.",
  sections=[
   ("Hallucinations: confident but wrong", [
     ("p","A hallucination is a fluent answer that is false or invented: a fake quote, a made-up study, a function that does not exist. Can you spot the invented facts below?"),
     ("widget","halluc")]),
   ("Protect private information", [
     ("p","Anything you type into an AI tool may be stored or seen by others, depending on the tool's rules."),
     ("ul",["Never paste passwords, keys, customer data, or confidential documents into tools you are not approved to use.","Use made-up or anonymized examples when practising.","Know your organization's AI policy."]),
     ("warn","If you would not post it publicly, do not paste it into an unapproved tool.")]),
   ("Bias and fairness", [
     ("p","Models learn from human-written data, which contains stereotypes and gaps. Their answers can reflect those. Review outputs about people, hiring, lending or health with extra care, and keep a human decision-maker in the loop.")]),
   ("Prompt injection", [
     ("p","If an AI reads a web page or document, hidden instructions inside it can try to hijack the AI. This is prompt injection."),
     ("p","Defenses: treat outside content as data, not instructions; limit what tools the AI can use; require approval for sensitive actions.")]),
   ("Copyright and attribution", [
     ("ul",["Check licensing before reusing generated code, images or text commercially.","Disclose AI help where your school or company requires it.","Verify quotes and citations before sharing."])]),
   ("Try it: Safe or risky?", [
     ("p","Decide whether each situation is a good idea."),
     ("widget","riskspot")]),
   ("Good habits checklist", [
     ("task",["I check important facts from reliable sources.","I do not share confidential data with unapproved tools.","I review AI output before sending or publishing it.","I keep a human in charge of high-stakes decisions.","I know where to find my organization's AI policy."])]),
  ]),
]
