"""Builds Module 2 (GenAI Interview Q&A Bank) of the Interview & Portfolio Mastery course.
Run: python3 tools/build_qa_module.py   (after build_interview_course.py so the landing page lists it)
Content: tools/qa_phase1.py ... qa_phase6.py (PHASE dicts). Visuals: interview-mastery/qa-p1.js ... qa-p6.js."""
import html, json, os, sys, importlib
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from interview_content import COURSE, MODULES
e = html.escape
OUT = os.path.join(HERE, "..", "interview-mastery")
CSS = open(os.path.join(HERE, "module.css")).read()
THEME = "<script>document.documentElement.setAttribute('data-theme', localStorage.getItem('genai-resources-theme') || 'light');</script>"
M = next(m for m in MODULES if m["key"] == "module-2-genai-qa")
PHASES = [importlib.import_module(f"qa_phase{i}").PHASE for i in range(1, 7)]

QA_CSS = """
details.qa{border:1px solid var(--bd);border-left:5px solid var(--c);border-radius:12px;background:var(--bg2);margin:0 0 12px}
details.qa>summary{cursor:pointer;padding:14px 16px;font-weight:700;font-size:16px;list-style:none;display:flex;gap:10px;align-items:baseline}
details.qa>summary::-webkit-details-marker{display:none}
details.qa>summary::after{content:'▸';margin-left:auto;color:var(--tx2);transition:transform .15s}
details.qa[open]>summary::after{transform:rotate(90deg)}
details.qa.done>summary .qn{background:#34c759;color:#fff}
.qn{flex:none;font:700 12px ui-monospace,Menlo,monospace;padding:3px 8px;border-radius:6px;background:var(--bg3);color:var(--tx)}
.qa-body{padding:0 18px 16px;font-size:15px}
.qa-body h5{font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:var(--tx2);margin:16px 0 6px}
.qa-body ul{margin:0 0 4px 20px}.qa-body li{margin:3px 0}
.lens{background:var(--bg);border:1px dashed var(--c);border-radius:10px;padding:2px 14px 10px}
.say{border-left:4px solid #34c759;background:rgba(52,199,89,.10);border-radius:0 10px 10px 0;padding:2px 14px 8px}
.say p{margin:6px 0 0}
.practiced{display:flex;gap:8px;align-items:center;margin-top:14px;font-size:13px;color:var(--tx2);cursor:pointer}
.practiced input{accent-color:#34c759}
.refs a{color:var(--ac)}
.qatools{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:6px 0 14px}
.qatools span{color:var(--tx2);font-size:13px}
.labcap{font-size:13px;color:var(--tx2);margin:-4px 0 6px}
.ph{display:inline-block;font-size:12px;font-weight:700;color:#fff;border-radius:999px;padding:2px 10px;background:var(--c)}
.frame{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:10px 0}
.frame div{background:var(--bg2);border:1px solid var(--bd);border-radius:10px;padding:10px;font-size:13px}
.frame b{display:block;font-size:14px;margin-bottom:2px}
"""

def lst(items): return "<ul>" + "".join(f"<li>{e(i)}</li>" for i in items) + "</ul>"
def refs(rs, label="📚 References"):
    if not rs: return ""
    return f"<h5>{label}</h5><ul class='refs'>" + "".join(f"<li><a href='{e(u, quote=True)}' target='_blank' rel='noopener noreferrer'>{e(t)}</a></li>" for t, u in rs) + "</ul>"
def widget(name): return f"<div class='widget' data-widget='{e(name, quote=True)}'></div>"

def card(P, i, q):
    qid = f"p{P['n']}q{i}"
    b = f"<div class='lens'><h5>🎯 What the interviewer wants to know</h5>{lst(q['wants'])}</div>"
    b += f"<div class='say'><h5>🗣️ Say this</h5><p>{e(q['say'])}</p></div>"
    if q.get("viz"): b += f"<h5>👀 See it</h5>{widget(q['viz'])}"
    b += f"<h5>🔍 Go deeper</h5>{lst(q['deeper'])}"
    if q.get("followups"): b += f"<h5>↪ Likely follow-ups</h5>{lst(q['followups'])}"
    if q.get("tip"): b += f"<div class='box tip'><strong>💡 Tip:</strong> {e(q['tip'])}</div>"
    b += refs(q.get("refs"))
    b += "<label class='practiced'><input type='checkbox'> I practiced this answer out loud</label>"
    return f"<details class='qa' id='{qid}' style='--c:{P['color']}'><summary><span class='qn'>Q{i}</span><span>{e(q['q'])}</span></summary><div class='qa-body'>{b}</div></details>"

def sections():
    s = []
    total = sum(len(P["qs"]) for P in PHASES)
    s.append(("How to use this module",
      f"<p>This bank has <strong>{total} questions</strong> in six phases that mirror how GenAI systems are built, and how interviewers structure their questioning: foundations, prompting, embeddings and vector databases, RAG, agents, and fine-tuning.</p>"
      "<p>Work one phase at a time. For each question, answer out loud first, then open the card and compare. Every card follows the same layout:</p>"
      "<div class='frame'><div><b>🎯 Interviewer lens</b>What signal they are looking for, and the trap to avoid</div><div><b>🗣️ Say this</b>A short answer you can speak in under a minute</div><div><b>🔍 Go deeper</b>The second-level detail that survives follow-ups</div><div><b>↪ Follow-ups</b>What they will probably ask next</div></div>"
      "<div class='box tip'><strong>💡 The answer pattern:</strong> definition in one line, how it works, one concrete example, then the trade-off. Depth matters more than coverage, because interviewers probe with follow-ups.</div>"
      "<div class='qatools'><button class='btn' id='qaToggleAll' type='button'>Expand all</button><span id='qaProgress' aria-live='polite'></span></div>"
      "<p class='wnote'>Visuals are interactive: drag 3D scenes to rotate, use the sliders and play buttons. Your practice ticks are saved in this browser.</p>"))
    for P in PHASES:
        lab = f"<span class='ph' style='--c:{P['color']}'>{e(P['tag'])}</span> <p>{e(P['intro'])}</p>"
        for t, w, cap in P["labs"]:
            lab += f"<h3>{e(t)}</h3><p class='labcap'>{e(cap)}</p>{widget(w)}"
        lab += refs(P.get("refs"), "📚 Go further")
        s.append((f"{P['title']}: visual lab", lab))
        s.append((f"{P['title'].split(':')[0]}: questions ({len(P['qs'])})", "".join(card(P, i, q) for i, q in enumerate(P["qs"], 1))))
    return s

QUIZ = [
 ("A user asks about a policy changed yesterday. Which fix gives a current, citable answer with the least rework?", ["Fine-tune on the new policy", "Retrieval-augmented generation over the updated document", "Raise the temperature", "Use a bigger context window and paste everything"], 1, "RAG reads from a live index, can cite chunks, and updates by re-indexing one document."),
 ("Why can a base model answer 'What is the capital of France?' with more questions?", ["It is broken", "Pre-training only teaches it to continue text; instruction tuning teaches it to answer", "Its context window is full", "Temperature is too low"], 1, "Next-token prediction continues patterns. SFT and alignment turn it into an assistant."),
 ("Two embedding vectors are A=[1,2,3] and B=[2,4,6]. Their cosine similarity is:", ["0", "0.5", "1.0", "-1"], 2, "B is 2x A, so the angle is zero. Cosine measures direction, not magnitude."),
 ("Retrieval returns the right documents but answers are still diluted by irrelevant text. Which step helps most?", ["Reranking with a cross-encoder and keeping the top few", "Switching to a larger model", "Removing the system prompt", "Doubling chunk size"], 0, "Retrieval maximizes recall, reranking restores precision before the context reaches the model."),
 ("In tool calling, who actually executes the function?", ["The LLM", "The application code", "The vector database", "The tokenizer"], 1, "The model only emits a structured request. Your runtime validates and executes it."),
 ("When is a multi-agent design most justified?", ["Always, it is more modern", "When the task decomposes into parallel or distinct specialties", "When latency must be minimal", "When the prompt is short"], 1, "Multi-agent systems multiply tokens and latency, so use them only when decomposition clearly pays."),
 ("Roughly what fraction of a layer's weights does LoRA with rank 8 train on a 4096x4096 matrix?", ["About 40%", "About 4%", "About 0.4%", "About 0.004%"], 2, "ΔW = B·A trains 4096x8 + 8x4096 ≈ 65K parameters versus 16.7M, around 0.4%."),
 ("What is the right escalation order for improving an LLM feature?", ["Fine-tune, RAG, prompt", "Prompting, few-shot, RAG for knowledge gaps, then fine-tuning", "Fine-tune first because it is permanent", "RAG, then fine-tune, then prompt"], 1, "Start with the cheapest lever and let evals justify each step up."),
]
FINAL = ("Final word", "<p>If you can answer all of these with a definition, the mechanism, an example and the trade-offs, you are prepared for the interview rounds and for the day-one realities of building production GenAI: RAG pipelines that actually retrieve, agents that actually complete tasks, and fine-tunes that actually beat their prompted baselines.</p><p>Keep building. Keep shipping.</p>")

def page():
    secs = sections()
    quiz_html = f"<p>Mixed review across all six phases. Pick an answer to see why.</p><div class='mq' data-quiz=\"{e(json.dumps([dict(q=q, o=o, c=c, e=x) for q, o, c, x in QUIZ]), quote=True)}\"></div>"
    secs += [("Check your understanding", quiz_html), FINAL]
    toc = "".join(f"<a href='#s{j}' data-i='{j}'>{e(t)}</a>" for j, (t, _) in enumerate(secs))
    body = "".join(f"<section id='s{j}' data-slide><h2 class='st'>{e(t)}</h2>{h}</section>" for j, (t, h) in enumerate(secs))
    others = "".join(f"<a href='{x['key']}.html'{' class=\"cur\"' if x is M else ''}>Module {x['n']}: {e(x['title'])}</a>" for x in MODULES)
    prev = MODULES[MODULES.index(M) - 1]
    nxt = MODULES[MODULES.index(M) + 1] if MODULES.index(M) + 1 < len(MODULES) else None
    pager = f"<a class='btn' href='{prev['key']}.html'>← {e(prev['title'])}</a>" + (f"<a class='btn p' href='{nxt['key']}.html'>{e(nxt['title'])} →</a>" if nxt else "<a class='btn p' href='index.html'>Back to course home</a>")
    scripts = "".join(f"<script src='{s}'></script>" for s in ["../modules/viz.js", "../modules/slides.js", "qa-core.js"] + [f"qa-p{i}.js" for i in range(1, 7)] + ["qa-init.js"])
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(M['title'])} - {e(COURSE['title'])}</title>
<style>{CSS}{QA_CSS}</style>
{THEME}
</head><body data-page="{M['key']}"><div class="progress"><div id="progressBar"></div></div><div class="layout">
<nav class="side"><h2>Interview &amp; Portfolio Mastery</h2><a class="back" href="index.html">← Course home</a><a class="back" href="../index.html">← Crash course</a><div class="grp">On this page</div>{toc}<div class="grp">Modules</div>{others}</nav>
<main style="--c:{M['color']}">
<header class="mod-head"><span class="badge">MODULE {M['n']} · {e(M['tag'])}</span><button class="btn viewtoggle" id="viewToggle" type="button">▦ Slide view</button><h1>{e(M['title'])}</h1><p class="intro">{e(M['intro'])}</p></header>
{body}
<div class="slidebar" id="slidebar"><button class="btn" id="prevSlide" type="button">←</button><span id="slideCount"></span><button class="btn p" id="nextSlide" type="button">→</button></div>
<div class="pager" id="pager">{pager}</div>
</main></div>{scripts}</body></html>"""

open(os.path.join(OUT, M["key"] + ".html"), "w").write(page())
print("built", M["key"], sum(len(P["qs"]) for P in PHASES), "questions")
