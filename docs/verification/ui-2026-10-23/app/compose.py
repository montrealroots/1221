"""A whole page from the slices `capture.mjs` takes of it: the window's top (the bar) once, the first slice of the main
column at the window's full width (with the rail beside it, which doesn't scroll), then each slice after it, of the main
column alone, set under the first at the column's left edge, the last one's overlap with the one before it cut off.

  python3 compose.py OUT.jpg TOP.png OVERLAP_LAST LEFT SLICE.png [SLICE.png ...]
"""
import sys
from PIL import Image

out, top, overlap, left, slices = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5:]
head = Image.open(top).convert('RGB')
first = Image.open(slices[0]).convert('RGB')
rest = [Image.open(s).convert('RGB') for s in slices[1:]]
if rest and overlap > 0:
    rest[-1] = rest[-1].crop((0, overlap, rest[-1].width, rest[-1].height))
w = max(head.width, first.width)
img = Image.new('RGB', (w, head.height + first.height + sum(p.height for p in rest)), (12, 13, 16))
img.paste(head, (0, 0))
img.paste(first, (0, head.height))
y = head.height + first.height
for p in rest:
    img.paste(p, (left, y)); y += p.height
img.save(out, quality=72)
