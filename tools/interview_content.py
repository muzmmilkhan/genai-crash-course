# Content for "GenAI Interview and Portfolio Mastery (Zero to Offer)".
# Block types: p, ul, code, tip, warn, table, task, widget ("scan30" | "scorecard" | "abtest").
COURSE = dict(
 key="interview-mastery", title="GenAI Interview and Portfolio Mastery (Zero to Offer)", color="#ff6b00",
 intro="A step-by-step course that takes you from no portfolio to interview calls and offers.",
)

MODULES = [
 dict(key="module-1-portfolio", n=1, title="Build a Portfolio That Gets You Calls", tag="Portfolio", color="#ff6b00",
  intro="Why a portfolio, not just a resume, earns you the interview, and how to build one that holds a recruiter's attention in the first 30 seconds.",
  sections=[
   ("Why a portfolio beats a resume alone", [
     ("p","When a recruiter has never heard of you, your portfolio is the source of truth about who you are. It backs up every claim on your resume with something they can click, read or watch."),
     ("ul",["Prepare it before you start applying, not after the first rejection.","A well-crafted portfolio separates you from candidates with similar resumes.","It gives recruiters a reason to spend more than a glance on your application."]),
     ("tip","Think of the resume as the trailer and the portfolio as the film. The trailer only has to earn the click.")]),
   ("The 30-second window", [
     ("p","Recruiters typically spend around 30 seconds on a first pass over a resume. Your only goal in that window is to leave a lasting impression and make them want to spend more time on your application."),
     ("p","Try it: you get 30 seconds with a sample resume. Spot what would make a recruiter stop reading."),
     ("widget","scan30"),
     ("p","What recruiters check in that first pass: your tagline, your most recent role, measurable outcomes, and links that prove you are active."),
     ]),
   ("Common resume mistakes", [
     ("ul",["Listing too many projects, especially small or insignificant ones. Pick the few that matter.","Not being outcome-driven. Describe the result and impact, not just the task.","Going over two pages. One page is preferred, two is the maximum."]),
     ("table",[["Weak bullet","Outcome-driven bullet"],["Worked on a chatbot for support","Built a support chatbot that deflected 35% of tickets and cut first-response time from 4 hours to 5 minutes"],["Responsible for the data pipeline","Rebuilt the ingestion pipeline, reducing nightly processing from 6 hours to 45 minutes"],["Used Python and SQL","Automated weekly reporting in Python and SQL, saving the team 10 hours a week"]]),
     ("warn","If you are not getting interview calls, the resume is most likely the problem, not your skills or experience. The resume's only job is to convince someone to call you.")]),
   ("Resume building principles", [
     ("ul",["Start from a ready-made template (Microsoft Word or an online resume builder). Do not spend days on design.","Add a one-line tagline that sums up your expertise.","Tailor your skills to the role: technical, leadership or business.","Focus on recent, relevant experience, roughly the last 2 to 3 years.","Highlight achievements and outcomes for each role.","Include education, certifications and other credentials."]),
     ("code","Example tagline:\nGenAI engineer who ships production RAG and agent systems, from prototype to monitored deployment."),
     ("p","Score your own resume against these principles:"),
     ("widget","scorecard")]),
   ("Use AI to refine your resume", [
     ("p","ChatGPT, Claude and similar tools are good at tightening language, fixing formatting and tailoring a resume to a job description. You stay in charge of the facts: never let a model invent experience or numbers."),
     ("code","You are an expert technical recruiter. Here is my resume and a job description.\n\n1. Rewrite each bullet to lead with the outcome and include a metric where one is already stated.\n2. Suggest a one-line tagline for this role.\n3. List skills in the job description that my resume does not show.\n4. Do NOT invent any experience, tools or numbers. Ask me if something is missing.\n\nRESUME:\n[paste]\n\nJOB DESCRIPTION:\n[paste]"),
     ("tip","Run the same resume through several prompts and compare. Different job descriptions deserve different prompts.")]),
   ("Multiple versions and A/B testing", [
     ("p","One resume rarely fits every role. Keep 4 to 5 versions, each aimed at a specific kind of job, for example technical lead, architect, manager or AI engineer."),
     ("p","Then treat it like an experiment: send each version to a similar number of roles and track which one produces interview calls."),
     ("widget","abtest"),
     ("warn","Change one thing at a time, and use enough applications per version before drawing conclusions. A handful of applications is noise, not evidence.")]),
   ("Your online presence", [
     ("p","Recruiters rarely stop at the resume. They look for evidence that matches it, usually in this order."),
     ("table",[["Channel","What recruiters look for","Make it strong"],["LinkedIn","Checked first to verify qualifications, experience and activity","Match it to your resume, add a clear headline, post or comment regularly"],["GitHub (tech roles)","Frequent commits and contributions to valuable projects","Pin your best repos, write real READMEs, commit consistently"],["Personal website","Projects, skills and experience in more detail","Host on Vercel for easy deployment, link it at the top of your resume"],["YouTube","Communication skills, presentation style and personality","Short walkthroughs of your projects are enough"]]),
     ("tip","Staying active matters as much as having the profiles. Update them regularly and keep contributing so they never look abandoned.")]),
   ("YouTube as a differentiator", [
     ("p","Few candidates publish videos, so a short one stands out. It lets a recruiter hear how you explain ideas and what you are like to work with, which a resume cannot show."),
     ("ul",["Keep videos short: a 3 to 5 minute project demo is enough.","Cover what the project does, how you built it, and what the result was.","Link the videos from your resume, LinkedIn and portfolio site.","Do not wait for perfect production. Clear and honest beats polished."])]),
   ("Your portfolio launch checklist", [
     ("p","Work through this before you send a single application. Your progress is saved in this browser."),
     ("task",["Resume is one page (two at most) with a one-line tagline","Every recent role has outcome-driven bullets","Resume tailored to the role, with 4 to 5 versions saved","LinkedIn matches the resume and is up to date","GitHub has pinned repos with clear READMEs","Personal website is live on Vercel","At least one short project video is published","Links to all of the above are at the top of the resume"]),
     ("p","Key takeaway: a strong portfolio built around outcomes, an active online presence and clear communication is what turns applications into interview calls.")]),
  ]),
]

MODULES.append(dict(key="module-2-genai-qa", n=2, title="GenAI Interview Q&A Bank", tag="Q&A", color="#5856D6", custom=True,
  blurb="70 questions across 6 phases · what interviewers want to know · model answers · interactive 2D/3D visuals",
  intro="70 real interview questions from foundations to fine-tuning. For each one you see what the interviewer is really testing, a model answer you can say out loud, the deeper detail that survives follow-ups, and an interactive visual where a picture beats a paragraph.",
  sections=[]))

QUIZ = {
 "module-1-portfolio": [
  ("How long do recruiters typically spend on a first look at a resume?", ["About 30 seconds", "About 10 minutes", "About 5 seconds", "As long as it takes to read every page"], 0, "The first pass is short, so the top of your resume must make them want to read on."),
  ("Which bullet is outcome-driven?", ["Worked on a chatbot", "Responsible for support tooling", "Built a chatbot that deflected 35% of support tickets", "Used Python daily"], 2, "Outcomes state the result and its impact, ideally with a metric."),
  ("What is the preferred resume length?", ["Three pages", "One page, two at most", "Five pages with all projects", "Length does not matter"], 1, "One page is preferred and two is the maximum."),
  ("You are getting no interview calls. What is the most likely cause?", ["Your skills are too weak", "The resume", "Too many LinkedIn followers", "Applying on a weekday"], 1, "If calls are not coming, the resume is likely the problem, so revise and test it."),
  ("How do you find out which resume version works best?", ["Ask a friend", "Use only the longest version", "A/B test several versions and track interview calls", "Pick one at random"], 2, "Send tailored versions to similar roles and compare how many calls each generates."),
  ("Why add a YouTube video to your portfolio?", ["It replaces the resume", "It shows communication skills and personality", "It guarantees an interview", "Recruiters require it"], 1, "Video lets recruiters assess how you explain ideas, which sets you apart."),
 ],
}
