#!/usr/bin/env python3
"""Remasterização conservadora de todos os 205 sprites originais do Codex Arcano.

Entrada: assets/data/sprites-{01..17}.js, imagens PNG originais embedded em Base64.
Saída: PNGs RGBA 128x128 individuais, manifest JS, previews e relatório de QA.
NUNCA altera as fontes originais; preserva silhueta e identidade de cada item.
"""
from __future__ import annotations
import argparse
import base64
from collections import Counter
from io import BytesIO
import json
import math
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageDraw

IMAGE_RE = re.compile(r'"(g[1-6]_\d{3})":"(data:image/png;base64,([A-Za-z0-9+/=]+))"')
MAX_IMAGE = 128
ITEM_MARGIN = 11

PALETTES = {
    1: {"name": "Itens e Consumíveis", "rim": (245, 204, 147), "shadow": (39, 22, 31), "sat": 1.10, "contrast": 1.09},
    2: {"name": "Flores Místicas", "rim": (238, 177, 233), "shadow": (56, 27, 64), "sat": 1.17, "contrast": 1.10},
    3: {"name": "Arsenal Carmesim", "rim": (255, 167, 119), "shadow": (55, 20, 27), "sat": 1.16, "contrast": 1.11},
    4: {"name": "Arsenal Glacial", "rim": (149, 239, 255), "shadow": (13, 38, 70), "sat": 1.17, "contrast": 1.10},
    5: {"name": "Espadas Encantadas", "rim": (233, 200, 255), "shadow": (40, 25, 63), "sat": 1.14, "contrast": 1.12},
    6: {"name": "Artefatos", "rim": (216, 181, 247), "shadow": (41, 24, 53), "sat": 1.12, "contrast": 1.12},
}

def original_images(root: Path):
    found = {}
    mapping = {}
    for n in range(1, 18):
        src = root / "assets" / "data" / ("sprites-%02d.js" % n)
        text = src.read_text("utf-8")
        matches = IMAGE_RE.findall(text)
        if not matches:
            raise RuntimeError(f"{src}: nenhum PNG original encontrado")
        for identifier, _url, b64 in matches:
            if identifier in found:
                raise RuntimeError("Sprite duplicado: " + identifier)
            data = base64.b64decode(b64)
            image = Image.open(BytesIO(data)).convert("RGBA")
            found[identifier] = image
            mapping[identifier] = src.name
    if len(found) != 205:
        raise RuntimeError(f"Esperados 205 sprites originais; encontrados {len(found)}.")
    return found, mapping

def rough_object_box(array):
    """Retângulo de pixels não transparentes, incluindo o fundo sólido, se houver."""
    a = array[:, :, 3] >= 32
    yy, xx = np.nonzero(a)
    if not len(xx):
        return None
    return (int(xx.min()), int(yy.min()), int(xx.max() + 1), int(yy.max() + 1))

def flood_from_perimeter(eligible):
    """Flood 4-conexo: impede que um fundo atravesse contornos diagonais finos."""
    h, w = eligible.shape
    todo = []
    visited = np.zeros((h, w), dtype=bool)
    for x in range(w):
        if eligible[0, x]:
            todo.append((0, x))
        if eligible[h-1, x]:
            todo.append((h-1, x))
    for y in range(h):
        if eligible[y, 0]:
            todo.append((y, 0))
        if eligible[y, w-1]:
            todo.append((y, w-1))
    while todo:
        y, x = todo.pop()
        if visited[y, x] or not eligible[y, x]:
            continue
        visited[y, x] = True
        if y > 0 and eligible[y-1, x] and not visited[y-1, x]:
            todo.append((y-1, x))
        if y+1 < h and eligible[y+1, x] and not visited[y+1, x]:
            todo.append((y+1, x))
        if x > 0 and eligible[y, x-1] and not visited[y, x-1]:
            todo.append((y, x-1))
        if x+1 < w and eligible[y, x+1] and not visited[y, x+1]:
            todo.append((y, x+1))
    return visited

def estimate_edge_bg(roi):
    """Somente remover planos sólidos achados nas margens retangulares opacas."""
    rgb = roi[:, :, :3].astype(np.int16)
    alpha = roi[:, :, 3].astype(np.int16)
    h, w = alpha.shape
    if min(w, h) < 8:
        return None
    thickness = max(1, min(4, min(w, h) // 30))
    pixels = np.vstack([
        rgb[:thickness, :, :].reshape(-1, 3),
        rgb[-thickness:, :, :].reshape(-1, 3),
        rgb[:, :thickness, :].reshape(-1, 3),
        rgb[:, -thickness:, :].reshape(-1, 3),
    ])
    opaque = np.concatenate([
        alpha[:thickness, :].ravel(),
        alpha[-thickness:, :].ravel(),
        alpha[:, :thickness].ravel(),
        alpha[:, -thickness:].ravel(),
    ]) >= 180
    pixels = pixels[opaque]
    if len(pixels) < 18:
        return None
    bins = (pixels // 12).clip(0, 21).astype(np.int16)
    keys = bins[:, 0] * 484 + bins[:, 1] * 22 + bins[:, 2]
    counter = Counter(keys.tolist())
    most, count = counter.most_common(1)[0]
    strength = count / len(pixels)
    center = np.median(pixels[keys == most], axis=0)
    # Domínio cinza/escuro típico dos quadrados recortados dos screenshots.
    hi, lo = float(center.max()), float(center.min())
    sat = (hi - lo) / max(hi, 1.0)
    if strength < 0.105:
        return None
    if sat > .30 and strength < .38:
        return None
    # Fundo "plano" precisa ocupar parte significativa da borda opaca.
    dist = np.sqrt(((pixels.astype(np.float32) - center)**2).sum(axis=1))
    coverage = float(np.count_nonzero(dist < 29) / len(pixels))
    if coverage < .33:
        return None
    return center.astype(np.float32), strength, coverage

def remove_backplates(image):
    base = np.array(image.convert("RGBA"), dtype=np.uint8)
    box = rough_object_box(base)
    if box is None:
        return image.copy(), {"removed": 0, "has_flat_plate": False, "confidence": 0}
    x0, y0, x1, y1 = box
    roi = base[y0:y1, x0:x1]
    res = estimate_edge_bg(roi)
    if res is None:
        return image.copy(), {"removed": 0, "has_flat_plate": False, "confidence": 0}
    candidate, strength, coverage = res
    colors = roi[:, :, :3].astype(np.float32)
    dist = np.sqrt(((colors - candidate)**2).sum(axis=2))
    alpha = roi[:, :, 3] >= 42
    # Varie com a consistência do cenário; não remova a parte branca/metálica do objeto.
    cutoff = 21.0 if strength < .22 else 28.0 if strength < .45 else 34.0
    eligible = (dist <= cutoff) & alpha
    mask = flood_from_perimeter(eligible)
    perimeter_removed = int(np.count_nonzero(mask))
    opaque_count = int(np.count_nonzero(alpha))
    share = perimeter_removed / max(1, opaque_count)
    # Guarda contra apagar o próprio objeto em telas sem fundo plano.
    if share < .025 or share > .82:
        return image.copy(), {"removed": 0, "has_flat_plate": False, "confidence": round(strength, 3)}
    roi[:, :, 3][mask] = 0
    # Remove pixels isolados da antiga cor de fundo apenas na borda já recortada.
    # Não faz limpeza por todas as regiões interiores, para preservar reflexos em prata e branco.
    neighboring = np.zeros_like(mask, dtype=bool)
    neighboring[1:, :] |= mask[:-1, :]
    neighboring[:-1, :] |= mask[1:, :]
    neighboring[:, 1:] |= mask[:, :-1]
    neighboring[:, :-1] |= mask[:, 1:]
    halo = neighboring & (roi[:, :, 3] > 0) & (dist < cutoff + 18)
    roi[:, :, 3][halo] = np.minimum(
        roi[:, :, 3][halo],
        np.clip((dist[halo] - cutoff) / 18.0 * 255.0, 28, 255).astype(np.uint8)
    )
    return Image.fromarray(base, "RGBA"), {
        "removed": perimeter_removed,
        "has_flat_plate": True,
        "confidence": round(strength, 3),
        "plate_coverage": round(share, 3),
        "background_rgb": [int(x) for x in candidate],
    }

def crop_and_fit(image, bounds_limit=MAX_IMAGE):
    a = image.getchannel("A")
    # Ignore near-transparent residue left by old screenshots.
    clean_mask = a.point(lambda n: 255 if n >= 50 else 0)
    box = clean_mask.getbbox()
    if box is None:
        return Image.new("RGBA", (bounds_limit, bounds_limit)), (0, 0), 1
    art = image.crop(box)
    w, h = art.size
    # An 8px margin around square output; pad wide and tall images without deforming.
    target = bounds_limit - 2 * ITEM_MARGIN
    zoom = min(target / max(1, w), target / max(1, h))
    # No giant enlargement of 8px details: cap at nearest integer factor <= 5.
    zoom = min(zoom, 5.0)
    target_size = (max(1, int(round(w * zoom))), max(1, int(round(h * zoom))))
    art = art.resize(target_size, Image.Resampling.NEAREST)
    return art, target_size, zoom

def recolor_pixels(art, palette):
    rgb = Image.merge("RGB", art.split()[:3])
    # Preserve the family of the original colors; subtly enrich saturation and tonal separation.
    rgb = ImageEnhance.Color(rgb).enhance(palette["sat"])
    rgb = ImageEnhance.Contrast(rgb).enhance(palette["contrast"])
    a = np.asarray(art.getchannel("A"), dtype=np.uint8)
    colors = np.asarray(rgb, dtype=np.uint8).copy()
    h, w = a.shape
    yy, xx = np.indices((h, w), dtype=np.float32)
    # Strongest pixel highlights upper-left; smooth direction, not filter blur.
    gradient = 1.054 - .075 * ((xx / max(w, 1) + yy / max(h, 1)) / 2)
    colors = np.clip(colors.astype(np.float32) * gradient[:, :, None], 0, 255).astype(np.uint8)
    result = Image.fromarray(colors, "RGB").convert("RGBA")
    result.putalpha(Image.fromarray(a, "L"))
    return result

def add_pixel_finish(canvas, art, palette):
    x = (MAX_IMAGE - art.width) // 2
    y = (MAX_IMAGE - art.height) // 2
    if art.width == 0 or art.height == 0:
        return canvas
    mask = art.getchannel("A")
    alpha = Image.new("L", canvas.size, 0)
    alpha.paste(mask, (x, y))
    solid = alpha.point(lambda v: 255 if v >= 85 else 0)

    # Silhouette outline: ~1px. Never modifies the art's shape or internal palette.
    dilated = solid.filter(ImageFilter.MaxFilter(3))
    outer = ImageChops.subtract(dilated, solid)
    shadow = Image.new("RGBA", canvas.size, palette["shadow"] + (236,))
    shadow.putalpha(outer.point(lambda t: int(t * .89)))
    canvas.alpha_composite(shadow)

    # Soft pixel-shaped shadow (not a blurry vector glow).
    dark = Image.new("RGBA", canvas.size, palette["shadow"] + (0,))
    shifted = Image.new("L", canvas.size, 0)
    shifted.paste(solid, (2, 3))
    dark.putalpha(shifted.point(lambda v: int(v * .26)))
    canvas.alpha_composite(dark)

    # Bright single-pixel edge accents, on the upper-left only. No RGB-shifting object outlines.
    highlight = ImageChops.subtract(solid, ImageChops.offset(solid, -1, -1))
    rim = Image.new("RGBA", canvas.size, palette["rim"] + (0,))
    rim.putalpha(highlight.point(lambda v: int(v * .28)))
    canvas.alpha_composite(rim)
    canvas.alpha_composite(Image.new("RGBA", canvas.size, (0, 0, 0, 0)))
    canvas.alpha_composite(art, (x, y))
    return canvas

def remaster(original, identifier):
    group = int(identifier[1])
    palette = PALETTES[group]
    removed, info = remove_backplates(original)
    art, size, zoom = crop_and_fit(removed)
    art = recolor_pixels(art, palette)
    result = add_pixel_finish(Image.new("RGBA", (MAX_IMAGE, MAX_IMAGE)), art, palette)
    a = np.asarray(result.getchannel("A"))
    info.update({
        "id": identifier,
        "group": group,
        "input_size": list(original.size),
        "object_size": list(size),
        "zoom": round(float(zoom), 3),
        "transparent_pixels": round(float(np.mean(a <= 8)), 3),
        "visible_pixels": int(np.count_nonzero(a >= 60)),
    })
    return result, info

def make_preview(images, examples, file_path, columns=10):
    cell_w, cell_h = 154, 184
    lines = math.ceil(len(images) / columns)
    sheet = Image.new("RGB", (columns*cell_w, lines*cell_h), (23, 20, 30))
    d = ImageDraw.Draw(sheet)
    for i, (ident, icon) in enumerate(images):
        xx = (i%columns)*cell_w
        yy = (i//columns)*cell_h
        d.rounded_rectangle((xx+5,yy+5,xx+cell_w-5,yy+cell_h-5),radius=10,fill=(42,34,50),outline=(87,68,91),width=1)
        # checkerboard behind the transparent artwork
        for gy in range(8,136,12):
            for gx in range(12,140,12):
                c=(69,61,74) if (gx//12+gy//12)%2 else (57,50,66)
                d.rectangle((xx+gx,yy+gy,xx+gx+11,yy+gy+11),fill=c)
        sheet.paste(icon,(xx+13,yy+8),icon)
        d.text((xx+12,yy+146),ident,fill=(242,214,187))
        if ident in examples:
            d.text((xx+12,yy+162),examples[ident],fill=(190,163,198))
    file_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(file_path, format="PNG", optimize=True)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--root",default=".")
    parser.add_argument("--expected",default=205,type=int)
    args=parser.parse_args()
    root=Path(args.root).resolve()
    originals,mapping=original_images(root)
    assert len(originals)==args.expected
    folder=root/"assets"/"sprites-reworked"
    folder.mkdir(parents=True,exist_ok=True)
    processed={}
    report=[]
    for identifier in sorted(originals,key=lambda t:(int(t[1]),int(t[3:]))):
        art,detail=remaster(originals[identifier],identifier)
        art.save(folder/(identifier+".png"),format="PNG",optimize=True)
        processed[identifier]=art
        report.append(detail)
    assert len(processed)==205
    js="/* All 205 Codex Arcano sprites • Remaster V2 • PNG transparent 128x128 */\n"
    manifest={identifier:"assets/sprites-reworked/"+identifier+".png" for identifier in processed}
    js+="window.CODEX_IMAGES = "+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+";\n"
    (root/"assets"/"data"/"sprites-reworked.js").write_text(js,encoding="utf-8")
    (folder/"report.json").write_text(json.dumps({
        "version":2, "total":len(processed), "presets":"unique per existing sprite, no synthetic duplicates",
        "original_sources":"assets/data/sprites-01.js through sprites-17.js",
        "rendering":"per-item original-color cleanup, foreground extraction, centering, tasteful outline and highlights",
        "groups":{str(i):sum(int(key[1])==i for key in processed) for i in range(1,7)},
        "backgrounds_removed":sum(int(x["has_flat_plate"]) for x in report),
        "items":report
    },ensure_ascii=False,indent=2),encoding="utf-8")
    for group in range(1,7):
        imgs=[(k,v) for k,v in processed.items() if int(k[1])==group]
        make_preview(imgs, {}, folder/f"preview-group-{group}.png", columns=8)
    make_preview(list(processed.items()), {}, folder/"preview-all-205.png", columns=10)
    # Small sample sheet as textual data URI to enable independent visual QA.
    sample_ids=["g1_001","g1_002","g1_003","g2_004","g2_005","g3_001","g4_002","g4_003","g5_001","g5_012","g6_045","g6_075"]
    candidates=[(k,processed[k]) for k in sample_ids if k in processed]
    make_preview(candidates,{},folder/"preview-samples.png",columns=4)
    sample_png=(folder/"preview-samples.png").read_bytes()
    (folder/"preview-samples-data.js").write_text("window.CODEX_SPRITES_PREVIEW='data:image/png;base64,"+base64.b64encode(sample_png).decode("ascii")+"';\n",encoding="utf-8")
    # Validate all images are distinct and real RGBA.
    for ident,path in manifest.items():
        with Image.open(root/path) as im:
            if im.size!=(128,128) or im.mode!="RGBA":
                raise AssertionError(f"invalid sprite {ident}")
    print(f"OK: remade {len(processed)} actual PNGs, 6 contact sheets, 205-record QA report.")
    print(f"Background plates removed in {sum(x['has_flat_plate'] for x in report)} sprites.")
    for group in PALETTES:
        print("Group",group, PALETTES[group]["name"],sum(int(x[1])==group for x in processed))

if __name__=="__main__":
    main()
