"""Builds the Interview and Portfolio Mastery course into ../interview-mastery/.
Run: python3 tools/build_interview_course.py
Reuses tools/module.css and modules/slides.js (slide view, copy buttons, checklists, mini quizzes)."""
import html, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from interview_content import COURSE, MODULES, QUIZ
e = html.escape
OUT = os.path.join(HERE, "..", "interview-mastery")
CSS = open(os.path.join(HERE, "module.css")).read()
THEME = "<script>document.documentElement.setAttribute('data-theme', localStorage.getItem('genai-resources-theme') || 'light');</script>"

def block(b):
    k, v = b[0], b[1]
    if k == "p": return f"<p>{e(v)}</p>"
    if k == "ul": return "<ul>" + "".join(f"<li>{e(i)}</li>" for i in v) + "</ul>"
    if k == "code": return f"<pre><code>{e(v)}</code></pre>"
    if k in ("tip", "warn"): return f"<div class='box {k}'><strong>{'💡 Tip' if k == 'tip' else '⚠️ Careful'}:</strong> {e(v)}</div>"
    if k == "task": return "<ul class='tasks'>" + "".join(f"<li><label><input type='checkbox'> {e(i)}</label></li>" for i in v) + "</ul>"
    if k == "widget": return f"<div class='widget' data-widget='{e(v)}'></div>"
    if k == "table":
        return "<table><tr>" + "".join(f"<th>{e(c)}</th>" for c in v[0]) + "</tr>" + "".join("<tr>" + "".join(f"<td>{e(c)}</td>" for c in r) + "</tr>" for r in v[1:]) + "</table>"
    raise ValueError(k)

def render(m, prev, nxt):
    quiz = QUIZ.get(m["key"])
    titles = [t for t, _ in m["sections"]] + (["Check your understanding"] if quiz else [])
    toc = "".join(f"<a href='#s{j}' data-i='{j}'>{e(t)}</a>" for j, t in enumerate(titles))
    secs = "".join(f"<section id='s{j}' data-slide><h2 class='st'>{e(t)}</h2>{''.join(block(b) for b in bl)}</section>" for j, (t, bl) in enumerate(m["sections"]))
    if quiz:
        data = e(json.dumps([dict(q=q, o=o, c=c, e=x) for q, o, c, x in quiz]), quote=True)
        secs += f"<section id='s{len(m['sections'])}' data-slide><h2 class='st'>Check your understanding</h2><p>Pick an answer to see the explanation.</p><div class='mq' data-quiz=\"{data}\"></div></section>"
    others = "".join(f"<a href='{x['key']}.html'{' class=\"cur\"' if x is m else ''}>Module {x['n']}: {e(x['title'])}</a>" for x in MODULES)
    pager = (f"<a class='btn' href='{prev['key']}.html'>← {e(prev['title'])}</a>" if prev else "<a class='btn' href='index.html'>← Course home</a>")
    pager += (f"<a class='btn p' href='{nxt['key']}.html'>{e(nxt['title'])} →</a>" if nxt else "<a class='btn p' href='index.html'>Back to course home</a>")
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(m['title'])} - {e(COURSE['title'])}</title>
<style>{CSS}</style>
{THEME}
</head><body data-page="{m['key']}"><div class="progress"><div id="progressBar"></div></div><div class="layout">
<nav class="side"><h2>Interview &amp; Portfolio Mastery</h2><a class="back" href="index.html">← Course home</a><a class="back" href="../index.html">← Crash course</a><div class="grp">On this page</div>{toc}<div class="grp">Modules</div>{others}</nav>
<main style="--c:{m['color']}">
<header class="mod-head"><span class="badge">MODULE {m['n']} · {e(m['tag'])}</span><button class="btn viewtoggle" id="viewToggle" type="button">▦ Slide view</button><h1>{e(m['title'])}</h1><p class="intro">{e(m['intro'])}</p></header>
{secs}
<div class="slidebar" id="slidebar"><button class="btn" id="prevSlide" type="button">←</button><span id="slideCount"></span><button class="btn p" id="nextSlide" type="button">→</button></div>
<div class="pager" id="pager">{pager}</div>
</main></div><script src="../modules/slides.js"></script><script src="course.js"></script></body></html>"""

def landing():
    cards = "".join(
        f"<a class='card' href='{m['key']}.html' style='--c:{m['color']}'><span class='badge'>MODULE {m['n']} · {e(m['tag'])}</span><h3>{e(m['title'])}</h3><p>{e(m['intro'])}</p><small>{len(m['sections'])} sections · interactive · quiz</small></a>"
        for m in MODULES)
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(COURSE['title'])}</title>
<style>{CSS}
main{{margin-left:0;max-width:880px;margin:0 auto}}
.cards{{display:grid;gap:16px;margin-top:28px}}
.card{{display:block;border:1px solid var(--bd);border-top:6px solid var(--c);border-radius:14px;padding:20px;background:var(--bg2);color:var(--tx);text-decoration:none}}
.card:hover{{border-color:var(--c)}}.card h3{{font-size:20px;margin:6px 0}}.card p{{color:var(--tx2);margin-bottom:8px}}.card small{{color:var(--tx2)}}
</style>
{THEME}
</head><body><main style="--c:{COURSE['color']}">
<p><a href="../index.html">← GenAI Crash Course</a></p>
<header class="mod-head"><span class="badge">COURSE</span><h1>{e(COURSE['title'])}</h1><p class="intro">{e(COURSE['intro'])}</p></header>
<div class="cards">{cards}</div>
<p class="note" style="margin-top:32px;color:var(--tx2);font-size:13px">More modules will be added here as the course grows.</p>
</main></body></html>"""

os.makedirs(OUT, exist_ok=True)
for i, m in enumerate(MODULES):
    open(os.path.join(OUT, m["key"] + ".html"), "w").write(render(m, MODULES[i-1] if i else None, MODULES[i+1] if i < len(MODULES) - 1 else None))
open(os.path.join(OUT, "index.html"), "w").write(landing())
print("built", len(MODULES), "module(s) + landing page")
