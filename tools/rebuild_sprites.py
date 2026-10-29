#!/usr/bin/env python3
"""Codex Arcano - rebuild the 205 existing RPG pixel sprites in place.
Keeps the original shapes and creates new 192x192 transparent PNGs.
This is algorithmic pixel-art restoration, not manually redrawn artwork.
"""
from PIL import Image, ImageFilter, ImageEnhance, ImageChops
from pathlib import Path
import math, shutil, json

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'assets'/'sprites-reworked'
BACKUP=ROOT/'assets'/'sprites-before-restoration'
TARGET=192
def restore(path):
    original=Image.open(path).convert('RGBA')
    # Work from alpha-matted artwork, never blend transparent black into edges.
    a=original.getchannel('A')
    bounds=a.point(lambda x:255 if x>20 else 0).getbbox()
    if not bounds: return False
    sprite=original.crop(bounds)
    # Fix isolated semi-transparent fringe while retaining intentional translucency.
    rgb=Image.merge('RGB',sprite.split()[:3])
    rgb=ImageEnhance.Contrast(rgb).enhance(1.075)
    rgb=ImageEnhance.Color(rgb).enhance(1.10)
    sprite=Image.merge('RGBA',(*rgb.split(),sprite.getchannel('A')))
    w,h=sprite.size
    # Actual object coverage rather than enlarging an entire 128px canvas.
    factor=min((TARGET-38)/max(w,1),(TARGET-38)/max(h,1))
    nw,nh=max(1,round(w*factor)),max(1,round(h*factor))
    sprite=sprite.resize((nw,nh),Image.Resampling.NEAREST)
    out=Image.new('RGBA',(TARGET,TARGET))
    x=(TARGET-nw)//2;y=(TARGET-nh)//2
    out.alpha_composite(sprite,(x,y))
    # Non-destructive hand-pixel-inspired rim shading: derive shadows from alpha.
    mask=out.getchannel('A')
    outside=mask.filter(ImageFilter.MaxFilter(3))
    outer=ImageChops.subtract(outside,mask)
    dark=Image.new('RGBA',out.size,(21,16,35,0));dark.putalpha(outer.point(lambda v:int(v*.79)))
    dark.alpha_composite(out)
    # Directional light only on existing colored opaque pixels; avoid glowing cutout.
    pix=dark.load()
    group=path.stem.split('_')[0]
    highlight={'g2':(255,210,233),'g3':(255,148,92),'g4':(168,236,255),'g5':(244,194,255),'g6':(255,192,220)}.get(group,(245,208,167))
    for yy in range(1,TARGET-1):
      for xx in range(1,TARGET-1):
        r,g,b,alpha=pix[xx,yy]
        if alpha<130:continue
        left=mask.getpixel((xx-1,yy));top=mask.getpixel((xx,yy-1))
        right=mask.getpixel((xx+1,yy));bottom=mask.getpixel((xx,yy+1))
        if (left<110 or top<110) and alpha>160:
          strength=.13 if group!='g4' else .19
          pix[xx,yy]=(int(r*(1-strength)+highlight[0]*strength),int(g*(1-strength)+highlight[1]*strength),int(b*(1-strength)+highlight[2]*strength),alpha)
        elif right<110 or bottom<110:
          pix[xx,yy]=(int(r*.83),int(g*.83),int(b*.87),alpha)
    dark.save(path,optimize=True)
    return True

def main():
    paths=sorted(SRC.glob('g*_*.png'))
    if len(paths)!=205:raise RuntimeError(f'Expected 205 files, found {len(paths)}')
    BACKUP.mkdir(parents=True,exist_ok=True)
    changes=0
    for p in paths:
        backup=BACKUP/p.name
        if not backup.exists():shutil.copy2(p,backup)
        # Source must always be original backup to prevent cumulative degradation.
        work=SRC/p.name
        shutil.copy2(backup,work)
        changes+=bool(restore(work))
    print(json.dumps({'processed':changes,'expected':205,'size':'192x192','backup':str(BACKUP)}))
    assert changes==205
if __name__=='__main__':main()
