# Content for "AI Product Engineering".
# Block types: p, ul, code, tip, warn, table, task, widget ("stackpicker" | "sdlcorder").
COURSE = dict(
 key="product-engineering", title="AI Product Engineering", short="AI Product Engineering", color="#0a84ff",
 intro="Learn the building blocks behind every modern system, AI-driven or not: code, data, storage, security, monitoring and payments. Then learn how a product moves from idea to deployment, and how to market it.",
)

MODULES = [
 dict(key="module-1-anatomy", n=1, title="Anatomy of a Modern System", tag="Foundations", color="#0a84ff",
  intro="Every product, with or without AI, is assembled from the same set of base components. Learn the map first, then the tools for each part.",
  sections=[
   ("Why start with components", [
     ("p","An AI model is rarely the whole product. Around it sits the same machinery that powers any application: somewhere to keep code, data, files and secrets, a way to know who the user is, and a way to see when things break."),
     ("p","Knowing these components lets you design a system, estimate effort, choose tools and talk to other engineers without guessing."),
     ("tip","You do not need to master every tool. You need to know what each component is for and have one sensible default for each.")]),
   ("The base components", [
     ("table",[["Component","What it does","Example tools"],
       ["Version control","Tracks code changes and enables collaboration","Git, GitHub"],
       ["Database","Stores structured data and, for AI, embeddings","Supabase, NeonDB, MongoDB Atlas, Pinecone, ChromaDB"],
       ["Caching layer","Serves repeated reads fast and cuts latency","Redis, Memcached"],
       ["File storage","Holds large files such as video, audio and documents","AWS S3, Azure Blob, Google Cloud Storage"],
       ["Notifications","Reaches users by email, SMS and push","SES, SNS, SendGrid, Twilio, Firebase, Exotel"],
       ["Authentication","Proves who the user is","Auth0, Firebase Auth, custom JWT/OAuth"],
       ["Monitoring and logging","Shows system health and explains failures","Prometheus, Grafana, ELK stack"],
       ["Security","Protects against abuse and attacks","Encryption, rate limiting, firewalls"],
       ["CDN","Delivers content from servers close to the user","Cloudflare, AWS CloudFront"],
       ["Environment management","Keeps configuration and secrets out of code","Vault, AWS Parameter Store"],
       ["Payments","Lets you charge for the product","Stripe, Razorpay"]])]),
   ("How the pieces fit together", [
     ("p","A typical request flows through several of these components. Following one request makes the roles concrete."),
     ("ul",["The browser asks the CDN for the page and static assets.","The user logs in and the authentication service returns a token.","The API checks the token, applies rate limits, then looks in the cache.","On a cache miss it queries the database, and for an AI feature it also calls a model.","Uploaded files go to object storage, never into the database.","A notification is sent, and every step writes logs and metrics for monitoring."]),
     ("code","Browser -> CDN -> API gateway (auth, rate limit)\n                     |-> Cache (Redis) --miss--> Database\n                     |-> Object storage (files)\n                     |-> LLM / vector DB (AI features)\n                     '-> Notifications, logs, metrics")]),
   ("Try it: pick a stack", [
     ("p","Choose a type of product and see which components it needs first, with a sensible starter tool for each."),
     ("widget","stackpicker"),
     ("warn","Start with the smallest stack that works. Every extra component is something you must secure, monitor and pay for.")]),
   ("Key takeaways", [
     ("ul",["Every system is built from a small set of reusable components.","AI features add models and vector databases, but not a different way of building.","Learn one default tool per component, then swap when a real need appears."]),
     ("task",["I can name all eleven base components","I can explain which components a request passes through","I have a default tool in mind for each component"])]),
  ]),

 dict(key="module-2-version-control", n=2, title="Version Control with Git and GitHub", tag="Code", color="#34c759",
  intro="Git records every change to your code. GitHub adds collaboration and automation on top. This is the first tool to learn and the one you will use every day.",
  sections=[
   ("What version control gives you", [
     ("ul",["A full history: see who changed what and why, and go back to any earlier version.","Safe experiments: try an idea on a branch without touching working code.","Collaboration: many people change the same project without overwriting each other.","Automation: GitHub can run tests and deploy on every push."]),
     ("tip","Git is the tool that runs on your machine. GitHub is a website that hosts Git repositories and adds pull requests, issues and automation.")]),
   ("The five commands to start", [
     ("code","git init                     # turn this folder into a repository\ngit add .                    # stage your changes\ngit commit -m \"Add login page\"  # save a snapshot with a message\ngit push origin main         # upload commits to GitHub\ngit pull origin main         # download others' commits"),
     ("table",[["Command","Meaning"],["init","Create a new repository in the current folder"],["add","Choose which changes go into the next commit"],["commit","Save the staged changes as a snapshot"],["push","Send your commits to the remote repository"],["pull","Fetch and merge new commits from the remote"]]),
     ("p","Check the state at any time with git status, and read history with git log --oneline.")]),
   ("Connecting to GitHub", [
     ("code","git remote add origin https://github.com/you/my-app.git\ngit branch -M main\ngit push -u origin main"),
     ("p","After the first push, git push and git pull are enough. Create the empty repository on GitHub first, then run these commands from your project folder."),
     ("warn","Never commit secrets such as API keys or passwords. List files to ignore in .gitignore, and rotate any key that was pushed by mistake.")]),
   ("Branches and pull requests", [
     ("p","Work on a branch, then open a pull request so a teammate can review before the change reaches main."),
     ("code","git switch -c feature/search   # create and move to a branch\n# ...edit, add, commit...\ngit push -u origin feature/search\n# open a pull request on GitHub, get a review, merge"),
     ("ul",["Keep branches small and short-lived.","Write commit messages that say why, not just what.","Review your own diff before asking anyone else."])]),
   ("Automation with GitHub Actions", [
     ("p","GitHub Actions runs workflows when something happens, such as a push. A common first workflow runs your tests on every pull request."),
     ("code","# .github/workflows/test.yml\nname: test\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test"),
     ("tip","Add deployment to the same workflow later, so merging to main ships the change.")]),
   ("Checklist", [
     ("task",["I installed Git and configured my name and email","I created a repository and made my first commit","I pushed it to GitHub","I opened and merged a pull request from a branch","I added a .gitignore that excludes secrets and dependencies"])]),
  ]),

 dict(key="module-3-data", n=3, title="Databases and Caching", tag="Data", color="#af52de",
  intro="Choose where your data lives. Compare relational, NoSQL and vector databases, then add a cache so repeated reads are fast.",
  sections=[
   ("Three kinds of database", [
     ("table",[["Type","Best for","How data looks"],["SQL (relational)","Structured data with relationships: users, orders, payments","Tables with rows and a fixed schema"],["NoSQL (document)","Flexible or fast-changing shapes: content, events, profiles","JSON-like documents"],["Vector","Similarity search over embeddings: RAG, recommendations","Vectors of numbers plus metadata"]]),
     ("p","Many products use more than one. A common AI setup is a SQL database for accounts and billing, plus a vector database for document search.")]),
   ("Which service for which job", [
     ("table",[["Service","Type","Good fit"],["Supabase","SQL (Postgres) with auth and storage built in","Fast start for a full app"],["NeonDB","Serverless Postgres","Cheap, scales to zero, branching for dev"],["MongoDB Atlas","Document NoSQL","Flexible schemas, hosted for you"],["Pinecone","Managed vector DB","Production-scale similarity search"],["ChromaDB","Open-source vector DB","Prototypes and local development"]]),
     ("tip","If unsure, start with Postgres. It handles most needs, and extensions such as pgvector add vector search later.")]),
   ("SQL in one minute", [
     ("code","CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email TEXT UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT now()\n);\n\nINSERT INTO users (email) VALUES ('a@example.com');\nSELECT id, email FROM users WHERE created_at > now() - interval '7 days';"),
     ("ul",["Add an index to columns you filter or join on often.","Use migrations so schema changes are versioned in Git.","Back up automatically and test that you can restore."])]),
   ("Vector databases for AI", [
     ("p","A vector database stores embeddings, numbers that capture meaning. You embed the user's question, then fetch the stored chunks closest in meaning and hand them to the model. This is the retrieval step in RAG."),
     ("code","# conceptual flow\nvector = embed(\"How do I reset my password?\")\nhits   = vector_db.query(vector, top_k=4)\nanswer = llm(question, context=hits)"),
     ("warn","Keep the source text and an ID next to every vector so you can show citations and re-index when your embedding model changes.")]),
   ("Caching with Redis and Memcached", [
     ("p","A cache keeps recent results in memory so the slow work (a database query or a model call) happens once. This lowers latency and cost."),
     ("table",[["Tool","Notes"],["Redis","In-memory store with strings, lists, hashes, expiry and pub/sub. The common default."],["Memcached","Simple, fast key-value cache. Fewer features, easy to run."]]),
     ("code","def get_profile(user_id):\n    key = f\"profile:{user_id}\"\n    cached = redis.get(key)\n    if cached:\n        return cached                 # cache hit\n    data = db.fetch_profile(user_id)  # cache miss\n    redis.set(key, data, ex=300)      # expire in 5 minutes\n    return data"),
     ("tip","This is the cache-aside pattern. Always set an expiry, and delete the key when the underlying data changes.")]),
   ("Checkpoint", [
     ("task",["I can choose between SQL, NoSQL and vector for a given feature","I created a free Postgres database on Supabase or Neon","I ran a basic CREATE, INSERT and SELECT","I can describe the cache-aside pattern"])]),
  ]),
 
 dict(key="module-4-storage-delivery", n=4, title="File Storage, CDNs and Notifications", tag="Delivery", color="#ff9500",
  intro="Keep large files out of your database, serve content fast to users anywhere, and reach them reliably by email, SMS and push.",
  sections=[
   ("Object storage for large files", [
     ("p","Videos, audio, images and documents are too big and too numerous for a database. Object storage keeps them as files in buckets, cheaply and durably, and you store only the file's URL or key in the database."),
     ("table",[["Cloud","Service"],["AWS","S3"],["Microsoft Azure","Blob Storage"],["Google Cloud","Cloud Storage (GCS)"]]),
     ("ul",["Keep buckets private by default.","Let users upload straight to storage with a pre-signed URL, so large files never pass through your server.","Set lifecycle rules to move or delete old files."]),
     ("code","# generate a short-lived upload link (boto3)\nurl = s3.generate_presigned_url(\n  \"put_object\",\n  Params={\"Bucket\": \"my-app-uploads\", \"Key\": \"u123/report.pdf\"},\n  ExpiresIn=600)")]),
   ("Content delivery networks", [
     ("p","A CDN copies your static files and cached responses to servers around the world, then serves each user from a nearby one. Pages load faster and your origin server handles less traffic."),
     ("ul",["Cloudflare and AWS CloudFront are the common choices.","Put images, scripts, video and downloads behind the CDN.","Set cache headers, and version file names (app.3f9a.js) so updates take effect."]),
     ("tip","A CDN also absorbs traffic spikes and adds a layer of protection against attacks.")]),
   ("Notifications", [
     ("p","Notifications bring users back and confirm important events. Pick the channel by urgency and reach."),
     ("table",[["Channel","Use for","Services"],["Email","Receipts, reports, password resets","SES, SendGrid"],["SMS","One-time codes, urgent alerts","SNS, Twilio, Exotel"],["Push","Timely nudges in mobile or web apps","Firebase Cloud Messaging"]]),
     ("warn","Respect consent. Offer opt-out, avoid spamming, and verify your sending domain (SPF and DKIM) so email lands in the inbox.")]),
   ("Design a reliable notification flow", [
     ("ul",["Do not send inside the web request. Put a job on a queue and let a worker send it.","Retry failures with backoff, and record delivery status.","Store user preferences for each channel.","Use templates so copy changes do not need a deploy."]),
     ("code","# in the request handler\nqueue.enqueue(\"send_email\", to=user.email, template=\"welcome\")\nreturn {\"ok\": True}   # respond immediately")]),
   ("Checkpoint", [
     ("task",["I created a private bucket and uploaded a file","I generated a pre-signed upload URL","I can explain what a CDN does and when to use one","I sent a test email or SMS through a provider"])]),
  ]),

 dict(key="module-5-security", n=5, title="Authentication, Security and Secrets", tag="Security", color="#ff3b30",
  intro="Know who your users are, protect the system from abuse, and keep keys and configuration out of your code.",
  sections=[
   ("Authentication basics", [
     ("p","Authentication answers who is this user. Authorization answers what are they allowed to do. Treat them as separate steps."),
     ("table",[["Concept","Meaning"],["Password + hash","Store only a salted hash (bcrypt or argon2), never the password"],["JWT","A signed token the client sends with each request to prove identity"],["OAuth","Let users sign in with Google, GitHub and others without sharing passwords"],["Sessions","Server-side record of a logged-in user, referenced by a cookie"]])]),
   ("Build or buy", [
     ("table",[["Option","Choose it when"],["Auth0","You want hosted login, social sign-in and enterprise SSO quickly"],["Firebase Auth","You already use Firebase or need simple mobile and web sign-in"],["Custom auth","You need full control and accept the responsibility for getting it right"]]),
     ("warn","Rolling your own auth is easy to get subtly wrong. For most products, use a managed service and spend your time on the product.")]),
   ("Security layers", [
     ("ul",["Encryption: HTTPS everywhere for data in transit, and encryption at rest for databases and storage.","Rate limiting: cap requests per user or IP to stop abuse and runaway costs, which matters doubly when each request calls a paid model.","Firewalls and WAF: block known bad traffic before it reaches your app.","Input validation: never trust user input, whether it goes to SQL, a shell or a prompt.","Least privilege: give each service only the permissions it needs."]),
     ("code","# simple fixed-window rate limit with Redis\nkey = f\"rl:{user_id}:{int(time.time()//60)}\"\ncount = redis.incr(key)\nredis.expire(key, 60)\nif count > 30:\n    raise TooManyRequests()")]),
   ("AI-specific risks", [
     ("ul",["Prompt injection: user or document text that tries to override your instructions.","Data leakage: sensitive data placed in prompts or logs.","Cost abuse: unlimited model calls from one account.","Unsafe output: model text rendered as HTML or run as code without checks."]),
     ("tip","Treat model output like user input. Validate it before it touches a database, shell or page.")]),
   ("Environment variables and secrets", [
     ("p","API keys, database passwords and signing keys must live outside your code and outside Git."),
     ("table",[["Level","Tool"],["Local development","A .env file that is listed in .gitignore"],["Hosting platform","Built-in environment variable settings"],["Teams and production","HashiCorp Vault or AWS Parameter Store / Secrets Manager"]]),
     ("ul",["Use separate values for development, staging and production.","Rotate keys regularly and immediately after any leak.","Give each service its own key so one leak is contained."]),
     ("warn","If a key was ever committed, assume it is compromised. Revoke it. Deleting the commit is not enough.")]),
   ("Checklist", [
     ("task",["Login uses a managed provider or hashed passwords","All traffic is over HTTPS","Rate limiting protects every paid or expensive endpoint","Secrets are in env vars or a secret manager, never in Git","Each environment has its own keys"])]),
  ]),

 dict(key="module-6-monitoring-payments", n=6, title="Monitoring, Logging and Payments", tag="Operate", color="#5ac8fa",
  intro="See what your system is doing in production, and add payments so your product can earn money.",
  sections=[
   ("Logs, metrics and alerts", [
     ("p","Once real users arrive, you cannot watch the code run. Monitoring tells you something is wrong, and logs tell you why."),
     ("table",[["Signal","Question it answers","Example"],["Logs","What happened?","Error stack trace, a request line"],["Metrics","How is it doing over time?","Requests per second, p95 latency, error rate"],["Alerts","Do I need to act now?","Error rate above 2% for 5 minutes"]])]),
   ("The tools", [
     ("table",[["Tool","Role"],["Prometheus","Collects and stores metrics"],["Grafana","Dashboards and alerting on top of metrics and logs"],["ELK stack","Elasticsearch, Logstash and Kibana: collect, search and visualize logs"]]),
     ("tip","Log in a structured format (JSON) with a request ID, so one user's journey can be traced across services.")]),
   ("What to watch in an AI product", [
     ("ul",["Latency of model calls, and time to first token if you stream.","Token usage and cost per user and per feature.","Error and timeout rates from the model provider.","Quality signals: thumbs up or down, fallback rate, retrieval hit rate.","Cache hit rate, since it directly cuts cost."]),
     ("warn","Do not log sensitive user data or full prompts without a clear reason and a retention limit.")]),
   ("Payment gateways", [
     ("p","A payment gateway handles cards and other methods, compliance and fraud checks so you never store card numbers yourself."),
     ("table",[["Gateway","Typical fit"],["Stripe","Global products, subscriptions, strong developer experience"],["Razorpay","Products selling in India, with UPI and local methods"]]),
     ("ul",["Use hosted checkout where possible.","Rely on webhooks to confirm payment, not the browser redirect.","Verify webhook signatures and make handlers idempotent.","Model plans, usage limits and invoices in your database."]),
     ("code","# webhook handler sketch\nevent = verify_signature(request.body, request.headers[\"signature\"])\nif event.type == \"payment.succeeded\":\n    activate_plan(event.customer_id)   # safe to run twice")]),
   ("Pricing AI products", [
     ("p","Model calls cost money on every use, so pricing must cover that cost."),
     ("ul",["Estimate cost per active user, then price with a healthy margin.","Offer a free tier with hard limits.","Meter usage (credits, tokens or actions) for heavy features."])]),
   ("Checklist", [
     ("task",["I have dashboards for latency, errors and cost","An alert fires when errors spike","I processed a test payment in the gateway's sandbox","Webhooks are signature-verified and idempotent"])]),
  ]),

 dict(key="module-7-process", n=7, title="From Idea to Deployment", tag="Process", color="#30b0c7",
  intro="Teams follow a repeatable process to turn an idea into a shipped product. Learn the documents, the stages and the order they come in.",
  sections=[
   ("The development lifecycle", [
     ("p","Skipping early stages saves hours and costs weeks. Each stage reduces a different kind of risk."),
     ("table",[["Stage","Output","Question it answers"],["BRD","Business requirements document","Why are we building this, and what business result do we want?"],["PRD","Product requirements document","What should the product do, for whom?"],["HLD","High-level design","What are the major components and how do they connect?"],["LLD","Low-level design","How does each component work: APIs, schemas, classes?"],["Sprint planning","Prioritized work for a short cycle","What do we build next?"],["Wireframes","Screen sketches","What will the user see and do?"],["Architecture","Chosen stack and structure","Which tools and services will we use?"],["Coding","Working software","Does it do what the design says?"],["Testing","Verified behavior","Does it work, and does it keep working?"],["Fixing","Resolved defects","What broke and why?"],["Deployment","Live product","Can real users reach it safely?"]])]),
   ("Requirements: BRD and PRD", [
     ("ul",["BRD: the business goal, target market, success metrics and constraints. Written for stakeholders.","PRD: user stories, features, acceptance criteria and priorities. Written for the team."]),
     ("code","User story:\nAs a support agent, I want suggested answers drawn from our help docs,\nso that I can reply faster.\n\nAcceptance criteria:\n- Suggestions appear within 3 seconds\n- Each suggestion cites its source document\n- Agent can accept, edit or dismiss"),
     ("tip","Write measurable success criteria early, such as reduce average reply time by 30%. They also become your test for whether the AI feature is good enough.")]),
   ("Design: HLD and LLD", [
     ("p","HLD is the map: services, data stores, external APIs and how data flows. LLD zooms into each piece."),
     ("ul",["HLD: a diagram of components, plus key choices such as SQL vs NoSQL and hosted vs self-run.","LLD: API endpoints and payloads, database tables, prompt templates, error handling.","Record important decisions and their reasons so they can be revisited."])]),
   ("Plan, sketch and build", [
     ("ul",["Sprint planning: slice work into small pieces that ship in one to two weeks.","Wireframes: low-fidelity screens in Figma or on paper, tested with a few real users before coding.","Build the thinnest end-to-end slice first, then widen it."])]),
   ("Test, fix and deploy", [
     ("ul",["Unit tests for logic, integration tests for services, and evaluation sets for AI outputs.","Fix defects in order of user impact, and add a test for each bug.","Deploy through CI/CD, with staging first, small rollouts and an easy rollback.","After launch, watch the monitoring dashboards and feed what you learn into the next sprint."]),
     ("warn","A demo is not a product. Production needs auth, limits, monitoring, backups and a rollback plan.")]),
   ("Try it: put the stages in order", [
     ("p","Reorder the stages into the sequence a team would normally follow."),
     ("widget","sdlcorder")]),
  ]),

 dict(key="module-8-ai-coding", n=8, title="Building with AI Coding Tools", tag="AI Tools", color="#ff2d55",
  intro="AI coding tools such as Cursor speed up development when you use them with clear intent and careful review.",
  sections=[
   ("What AI coding tools do", [
     ("p","Tools like Cursor put a model inside your editor. They complete code, answer questions about your codebase, and make multi-file edits from a plain-language request."),
     ("ul",["Autocomplete for the next lines.","Chat that can see your project files.","Agent mode that plans and applies edits across files, and can run commands.","Rules files that tell the model your conventions."])]),
   ("A workflow that works", [
     ("ul",["Start from your PRD and design: paste the requirements and ask for a plan before any code.","Build in small steps and commit after each one that works.","Ask for tests alongside the code.","Run the code yourself. Read every diff.","When stuck, give the error message and the relevant files, not a vague description."]),
     ("code","Prompt:\nRead /docs/PRD.md and the existing /api folder.\nPlan how to add a /search endpoint that queries the vector DB.\nList the files you will change. Do not write code yet.")]),
   ("Write prompts the tool can act on", [
     ("table",[["Weak","Strong"],["Make it better","Reduce the page load time by lazy-loading images below the fold"],["Add login","Add email and password login using Supabase Auth; redirect to /dashboard; show errors inline"],["Fix the bug","Clicking Save twice creates duplicate rows. Here is the handler and the error log. Find the cause and add a test."]]),
     ("tip","Put project conventions in a rules file once, such as the language, test framework and folder layout, so every prompt starts from them.")]),
   ("Where to be careful", [
     ("ul",["Models can invent APIs or library functions. Check the docs when something looks unfamiliar.","Generated code may skip validation, auth checks or error handling.","Never paste secrets or private customer data into prompts.","Large unreviewed changes become code nobody understands. Keep steps small.","You remain responsible for security and correctness."]),
     ("warn","Speed without review shifts the cost to debugging later. Review AI code as you would a new teammate's pull request.")]),
   ("Checklist", [
     ("task",["I installed an AI coding tool and tried each of its modes","I wrote a rules file for one project","I built a small feature from a PRD using plan-then-code","I reviewed and tested every change before committing"])]),
  ]),

 dict(key="module-9-marketing", n=9, title="Marketing, Monetization and Entrepreneurship", tag="Business", color="#ffcc00",
  intro="A product nobody hears about earns nothing. Learn to find an audience, build in public and design a business that can sustain itself.",
  sections=[
   ("Build an audience while you build", [
     ("p","Do not wait for launch day to find users. Share the work as it happens so an audience exists when the product is ready."),
     ("ul",["Pick one or two platforms where your users already spend time, such as LinkedIn, X or YouTube.","Post what you are learning and building: screenshots, short demos, lessons.","Be consistent. A small post every week beats a big one every few months.","Reply to people and join conversations, not only broadcast."])]),
   ("Find the problem first", [
     ("ul",["Talk to ten potential users before writing code.","Look for a painful, frequent problem people already pay to solve or work around.","Narrow to a specific group. A product for everyone is marketed to no one."]),
     ("tip","If people will not give you ten minutes to talk about the problem, they will rarely pay to fix it.")]),
   ("Business models", [
     ("table",[["Model","How it earns","Watch out for"],["Subscription","Monthly or yearly plan","Churn; keep delivering value"],["Usage-based","Pay per action or token","Bills that surprise users; show usage clearly"],["Freemium","Free tier, paid upgrade","Free users still cost model spend"],["One-time purchase","Single payment","Ongoing costs with no ongoing revenue"],["Services or consulting","Charge for time or outcomes","Does not scale without you"]]),
     ("p","Check unit economics early: revenue per user minus the cost to serve them (hosting, model calls, support) must be positive.")]),
   ("Launch and learn", [
     ("ul",["Launch a small version to a small group and collect feedback.","Track a few numbers: sign-ups, activation, retention and revenue.","Ship improvements weekly and tell users what changed.","Collect testimonials and case studies as proof for the next customers."])]),
   ("Entrepreneurial mindset", [
     ("ul",["Treat ideas as hypotheses and test them cheaply.","Expect to be wrong often, and learn fast from it.","Focus on a customer outcome, not on technology for its own sake.","Combine skills: technical ability plus the ability to communicate and sell is rare and valuable."]),
     ("p","Key takeaway: the best system design, the right tools and a repeatable process all serve the same goal, a product that solves a real problem and sustains itself.")]),
   ("Final checklist", [
     ("task",["I know who my first ten users are","I have a public place where I share progress","My pricing covers the cost of serving each user","I have a plan to launch to a small group and collect feedback"])]),
  ]),
]

QUIZ = {
 "module-1-anatomy": [
  ("Where should large video and audio files be stored?", ["In the SQL database", "In object storage such as S3", "In the Git repository", "In the cache"], 1, "Object storage is built for large files. Keep only the file key or URL in the database."),
  ("What does a CDN primarily do?", ["Stores user passwords", "Serves content from locations close to users", "Runs your tests", "Trains models"], 1, "A CDN caches content near users to cut latency."),
  ("Which component keeps API keys out of the code?", ["Environment management", "CDN", "Cache", "Notifications"], 0, "Tools such as Vault and Parameter Store hold secrets and configuration."),
  ("Does an AI product need different base components from a normal one?", ["Yes, none overlap", "No, it adds models and vector search on top of the same components", "Only a GPU", "Only a database"], 1, "AI features add to the same foundation."),
 ],
 "module-2-version-control": [
  ("Which command saves a snapshot of staged changes?", ["git push", "git commit", "git pull", "git init"], 1, "Commit records the staged changes with a message."),
  ("What is the difference between Git and GitHub?", ["None", "Git is the version control tool, GitHub hosts repositories and adds collaboration", "GitHub is local, Git is online", "Git is only for AI"], 1, "Git runs locally. GitHub is a hosting and collaboration platform."),
  ("You accidentally pushed an API key. What should you do?", ["Delete the commit and carry on", "Revoke and rotate the key", "Make the repo private only", "Nothing"], 1, "Assume it is compromised. Revoke it first."),
  ("Why use a branch and pull request?", ["To hide changes", "To review changes safely before merging to main", "To avoid commits", "To speed up the internet"], 1, "Branches isolate work and pull requests add review."),
 ],
 "module-3-data": [
  ("Which database type is best for similarity search over embeddings?", ["Vector database", "Key-value cache", "Object storage", "CDN"], 0, "Vector databases index embeddings for nearest-neighbor search."),
  ("What is a sensible default if you are unsure which database to use?", ["Postgres", "A spreadsheet", "Flat files", "Memcached"], 0, "Postgres covers most needs and can add vector search with pgvector."),
  ("In the cache-aside pattern, what happens on a cache miss?", ["Return an error", "Read from the database, then store the result in the cache", "Delete the database", "Restart Redis"], 1, "Load from the source and populate the cache with an expiry."),
  ("Why set an expiry on cached values?", ["To save disk", "So stale data eventually refreshes", "Redis requires it", "To encrypt them"], 1, "Expiry limits how long outdated data can be served."),
 ],
 "module-4-storage-delivery": [
  ("Why use a pre-signed URL for uploads?", ["It compresses files", "Clients upload directly to storage without passing through your server", "It makes buckets public", "It replaces auth"], 1, "It is time-limited and keeps large transfers off your server."),
  ("Where should a notification email be sent from?", ["Inside the web request", "A background worker fed by a queue", "The browser", "The CDN"], 1, "Queues give retries and keep requests fast."),
  ("Which channel suits one-time codes and urgent alerts?", ["SMS", "Newsletter", "Blog", "RSS"], 0, "SMS is immediate and widely reachable."),
  ("What helps a CDN serve updated files?", ["Versioned file names", "Larger servers", "Deleting the CDN", "Disabling HTTPS"], 0, "Changing the file name forces a fresh fetch."),
 ],
 "module-5-security": [
  ("What should you store for a user's password?", ["The plain password", "A salted hash", "A reversible encryption", "Nothing at all, ever"], 1, "Use bcrypt or argon2 hashes."),
  ("Why is rate limiting especially important for AI endpoints?", ["It makes models smarter", "Each request can cost real money", "It is required by Git", "It speeds up caching"], 1, "It prevents abuse and runaway model costs."),
  ("A key was committed to a public repo. What is the right response?", ["Delete the file", "Revoke and replace the key", "Rename the repo", "Ignore it"], 1, "History keeps the key, so it must be revoked."),
  ("How should model output be treated?", ["As trusted", "Like user input: validate before use", "As encrypted", "As already sanitized"], 1, "Models can output unsafe content."),
 ],
 "module-6-monitoring-payments": [
  ("Which tool pair is commonly used for metrics and dashboards?", ["Prometheus and Grafana", "Git and GitHub", "Stripe and Razorpay", "Redis and Memcached"], 0, "Prometheus collects metrics and Grafana visualizes them."),
  ("How should you confirm a payment succeeded?", ["The browser redirect", "A signed webhook from the gateway", "The user's word", "A cached value"], 1, "Webhooks are authoritative. Verify the signature."),
  ("Why should webhook handlers be idempotent?", ["Events can be delivered more than once", "It speeds them up", "To avoid logging", "It is optional for payments"], 0, "Retries mean the same event may arrive twice."),
  ("Which is an AI-specific metric worth tracking?", ["Token usage and cost", "Font size", "Number of branches", "CSS file count"], 0, "Cost per request is a first-class concern."),
 ],
 "module-7-process": [
  ("Which document explains the business reason for a project?", ["BRD", "LLD", "Unit test", "Changelog"], 0, "The BRD captures business goals and success measures."),
  ("What does the HLD describe?", ["Major components and how they connect", "Every variable name", "Marketing plans", "Test results"], 0, "High-level design is the system map."),
  ("What should accompany each bug fix?", ["A test that would have caught it", "A new framework", "A meeting", "Nothing"], 0, "A regression test keeps it from returning."),
  ("Which stage comes first?", ["Deployment", "Business requirements", "Testing", "Coding"], 1, "Requirements come before design and code."),
 ],
 "module-8-ai-coding": [
  ("What is a good first step with an AI coding agent on a big feature?", ["Ask for a plan before code", "Accept all edits", "Disable tests", "Paste secrets"], 0, "A plan lets you correct the direction cheaply."),
  ("Why read every diff the tool produces?", ["Models can be wrong or skip checks", "It is required by Cursor", "Diffs are encrypted", "To save time"], 0, "You remain responsible for correctness and security."),
  ("What is a rules file for?", ["Hosting the app", "Telling the model your project's conventions", "Storing keys", "Billing"], 1, "It keeps outputs consistent with your standards."),
  ("Which prompt is strongest?", ["Make it better", "Fix the bug", "Clicking Save twice creates duplicate rows; here is the handler. Find the cause and add a test", "Do it"], 2, "Specific context and a clear goal produce useful results."),
 ],
 "module-9-marketing": [
  ("When should you start building an audience?", ["After launch", "While you build", "Never", "After raising money"], 1, "Sharing progress early means users exist at launch."),
  ("What must be true of unit economics?", ["Revenue per user exceeds cost to serve", "Costs equal zero", "Free tier is unlimited", "Pricing is hidden"], 0, "Model and hosting costs must be covered."),
  ("What is the first thing to do before writing code for a new idea?", ["Buy a domain", "Talk to potential users about the problem", "Hire a team", "Design a logo"], 1, "Validate the problem first."),
  ("Which pricing model charges per action or token?", ["Usage-based", "One-time purchase", "Freemium only", "Donation"], 0, "Usage-based pricing scales with consumption."),
 ],
}
