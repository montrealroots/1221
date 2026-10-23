"""A whole page from the slices `pages.mjs` takes of it, as `compose.py` joins `capture.mjs`'s, with the part below what
scrolls (a dialog's foot) as well, and images at the window's pixel ratio: the part above once, the first slice at the
window's width, each slice after it set under the first at the scroller's left edge (the last one's overlap with the one
before it cut off), then the part below. A page taller than MAX pixels is cut into equal parts, each overlapping the one
before it by OVERLAP pixels, so nothing falls between two. It prints how many files it wrote.

  python3 pages-compose.py OUT.jpg DPR ABOVE.png|- BELOW.png|- OVERLAP_LAST LEFT SLICE.png [SLICE.png ...]
"""
import sys
from PIL import Image

MAX, OVERLAP = 12000, 300
out, dpr, above, below, overlap, left, slices = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4], int(sys.argv[5]), int(sys.argv[6]), sys.argv[7:]
head = Image.open(above).convert('RGB') if above != '-' else None
foot = Image.open(below).convert('RGB') if below != '-' else None
first = Image.open(slices[0]).convert('RGB')
rest = [Image.open(s).convert('RGB') for s in slices[1:]]
if rest and overlap > 0:
    rest[-1] = rest[-1].crop((0, round(overlap * dpr), rest[-1].width, rest[-1].height))
w = max(x.width for x in [first] + ([head] if head else []) + ([foot] if foot else []))
h = (head.height if head else 0) + first.height + sum(p.height for p in rest) + (foot.height if foot else 0)
img = Image.new('RGB', (w, h), (12, 13, 16))
y = 0
for part, x in [(head, 0), (first, 0)] + [(p, round(left * dpr)) for p in rest] + [(foot, 0)]:
    if part is None:
        continue
    img.paste(part, (x, y)); y += part.height
if img.height <= MAX:
    img.save(out, quality=70, optimize=True, progressive=True)
    print(1)
else:
    k = -(-(img.height - OVERLAP) // (MAX - OVERLAP))
    step = (img.height - OVERLAP) / k
    stem = out[:-len('.jpg')]
    for i in range(k):
        top = round(i * step)
        bottom = img.height if i == k - 1 else round(top + step + OVERLAP)
        img.crop((0, top, img.width, bottom)).save(f'{stem}-part{i + 1}of{k}.jpg', quality=70, optimize=True, progressive=True)
    print(k)
