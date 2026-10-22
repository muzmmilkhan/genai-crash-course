import html, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from content import MODULES
from content2 import QUIZZES, LABS, GLOSS_PAGE, GLOSSARY
from diagrams import VIZ
e = html.escape
OUT = os.path.join(HERE, "..", "modules")

CSS = open(os.path.join(HERE, "module.css")).read()

def block(b):
    k, v = b[0], b[1]
    if k == "p": return f"<p>{e(v)}</p>"
    if k == "ul": return "<ul>" + "".join(f"<li>{e(i)}</li>" for i in v) + "</ul>"
    if k == "code": return f"<pre><code>{e(v)}</code></pre>"
    if k in ("tip", "warn"): return f"<div class='box {k}'><strong>{'💡 Tip' if k=='tip' else '⚠️ Careful'}:</strong> {e(v)}</div>"
    if k == "task": return "<ul class='tasks'>" + "".join(f"<li><label><input type='checkbox'> {e(i)}</label></li>" for i in v) + "</ul>"
    if k == "widget":
        name, _, arg = v.partition(":")
        return f"<div class='widget' data-widget='{name}'" + (f" data-arch='{arg}'" if arg else "") + "></div>"
    if k == "hidden": return ""
    if k == "table":
        h, rows = v[0], v[1:]
        return "<table><tr>" + "".join(f"<th>{e(c)}</th>" for c in h) + "</tr>" + "".join("<tr>" + "".join(f"<td>{e(c)}</td>" for c in r) + "</tr>" for r in rows) + "</table>"
    raise ValueError(k)

def plain(blocks):
    out = []
    for b in blocks:
        v = b[1]
        if b[0] == 'widget': continue
        if isinstance(v, str): out.append(v)
        elif b[0] == "table": out += [" ".join(r) for r in v]
        else: out += v
    return " ".join(out)

ALL_PAGES = [(m["title"], m["key"] + ".html") for m in MODULES] + [(l["title"].split(": ")[1], l["key"] + ".html") for l in LABS] + [(GLOSS_PAGE["title"], "glossary.html")]
index = []

def with_widgets(m):
    return m

def render(m, slide, prev, nxt, kind):
    m = with_widgets(m)
    quiz = QUIZZES.get(m["key"])
    secs_data = list(m["sections"])
    toc_titles = [t for t, _ in secs_data] + (["Check your understanding"] if quiz else [])
    toc = "".join(f"<a href='#s{j}' data-i='{j}'>{e(t)}</a>" for j, t in enumerate(toc_titles))
    attr = " data-slide" if slide else ""
    secs = "".join(f"<section id='s{j}'{attr}><h2 class='st'>{e(t)}</h2>{VIZ.get((m['key'], t), '')}{''.join(block(b) for b in bl)}</section>" for j, (t, bl) in enumerate(secs_data))
    if quiz:
        j = len(secs_data)
        data = e(json.dumps([dict(q=q, o=o, c=c, e=ex) for q, o, c, ex in quiz]), quote=True)
        secs += f"<section id='s{j}'{attr}><h2 class='st'>Check your understanding</h2><p>Pick an answer to see the explanation.</p><div class='mq' data-quiz=\"{data}\"></div></section>"
    others = "".join(f"<a href='{u}'{' class=\"cur\"' if u == m['key'] + '.html' else ''}>{e(t)}</a>" for t, u in ALL_PAGES)
    pager = (f"<a class='btn' href='{prev[1]}'>← {e(prev[0])}</a>" if prev else "<span></span>")
    if kind == "module":
        pager += f"<a class='btn' href='../index.html?module={m['key']}'>Related resources</a>"
    pager += (f"<a class='btn p' href='{nxt[1]}'>{e(nxt[0])} →</a>" if nxt else "<a class='btn p' href='../index.html?module=references'>References →</a>")
    badge = f"MODULE {m['n']} · {m['tag']}" if kind == "module" else m["tag"].upper()
    toggle = "<button class='btn viewtoggle' id='viewToggle' type='button'>▦ Slide view</button>" if slide else ""
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(m['title'])} - GenAI Crash Course for Beginners</title>
<style>{CSS}</style>
<script>document.documentElement.setAttribute('data-theme', localStorage.getItem('genai-resources-theme') || 'light');</script>
</head><body data-page="{m['key']}"><div class="progress"><div id="progressBar"></div></div><div class="layout">
<nav class="side"><h2>GenAI Crash Course</h2><a class="back" href="../index.html">← Home</a><div class="grp">On this page</div>{toc}<div class="grp">All pages</div>{others}</nav>
<main style="--c:{m['color']}">
<header class="mod-head"><span class="badge">{e(badge)}</span>{toggle}<h1>{e(m['title'])}</h1><p class="intro">{e(m['intro'])}</p></header>
{secs}
<div class="slidebar" id="slidebar"><button class="btn" id="prevSlide" type="button">←</button><span id="slideCount"></span><button class="btn p" id="nextSlide" type="button">→</button></div>
<div class="pager" id="pager">{pager}</div>
<p class="note">Original educational material based on public documentation and general knowledge. Features and commands change, so confirm details in the official docs.</p>
</main></div><script src="viz.js"></script><script src="glossary-data.js"></script><script src="slides.js"></script><script src="widgets.js"></script></body></html>"""

def write(m, slide, kind, prev, nxt):
    m = with_widgets(m)
    open(os.path.join(OUT, m["key"] + ".html"), "w").write(render(m, slide, prev, nxt, kind))
    for j, (t, bl) in enumerate(m["sections"]):
        index.append(dict(u=f"modules/{m['key']}.html#s{j}", p=m["title"], s=t, t=plain(bl)))

seq = [(m, True, "module") for m in MODULES] + [(l, False, "lab") for l in LABS] + [(GLOSS_PAGE, False, "ref")]
for i, (m, slide, kind) in enumerate(seq):
    prev = ALL_PAGES[i-1] if i else None
    nxt = ALL_PAGES[i+1] if i < len(seq) - 1 else None
    write(m, slide, kind, prev, nxt)
open(os.path.join(OUT, "glossary-data.js"), "w").write("window.GLOSSARY=" + json.dumps(GLOSSARY, ensure_ascii=False) + ";")
open(os.path.join(OUT, "search-index.js"), "w").write("window.SEARCH_INDEX=" + json.dumps(index, ensure_ascii=False) + ";")
print("built", len(seq), "pages,", len(index), "search entries")
