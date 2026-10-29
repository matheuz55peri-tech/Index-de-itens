#!/usr/bin/env python3
"""GitHub Pages smoke test: real browser, no user data, only ephemeral local HTTP."""
import base64
import functools
import http.server
import json
import pathlib
import socket
import socketserver
import struct
import threading
import zlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / "test-artifacts"
SHOTS.mkdir(exist_ok=True)
PORT = 8765

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def png_chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)

def sample_png():
    w = h = 80
    raw = []
    for y in range(h):
        row = bytearray()
        for x in range(w):
            filled = 23 <= x < 57 and 23 <= y < 57
            row.extend((29, 21, 44, 255) if filled else (255, 255, 255, 255))
        raw.append(b"\0" + bytes(row))
    return b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", struct.pack(">2I5B", w, h, 8, 6, 0, 0, 0)) + png_chunk(b"IDAT", zlib.compress(b"".join(raw))) + png_chunk(b"IEND", b"")

httpd = socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Handler, directory=str(ROOT)))
threading.Thread(target=httpd.serve_forever, daemon=True).start()

with sync_playwright() as play:
    browser = play.chromium.launch(headless=True, args=["--no-sandbox"])
    context = browser.new_context(accept_downloads=True, viewport={"width": 1350, "height": 900})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    try:
        page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="domcontentloaded")
        page.locator("#grid .card").first.wait_for(timeout=12000)
        page.locator(".cx-welcome").wait_for(timeout=12000)
        assert page.locator(".cx-help-button").count() == 1, "Wiki: help button missing"
        assert page.locator(".nav-btn").count() >= 6, "Wiki: category navigation missing"
        assert page.locator("#grid .card").count() > 30, "Wiki: original items disappeared"
        # Todos os 205 sprites são PNGs novos, não apenas estilo dos cartões.
        page.locator(".codex-compare").wait_for(timeout=12000)
        assert page.locator("#grid .card").count() == 205, "Wiki: 205 individual art cards missing"
        remaster_urls=page.locator("#grid .card img").evaluate_all(
            "(nodes)=>nodes.map(i=>new URL(i.src).pathname).filter(p=>p.includes('/assets/sprites-reworked/'))"
        )
        assert len(remaster_urls)==205, f"Wiki: {len(remaster_urls)} new PNGs instead of 205"
        missing_art=page.evaluate("""async () => {
            const urls = [...document.querySelectorAll('#grid .card img')].map(i=>i.src);
            return (await Promise.all(urls.map(async url => {
               const pic = new Image(); pic.src=url;
               try {await pic.decode();return null} catch(e){return url}
            }))).filter(Boolean)
        }""")
        assert not missing_art, f"Wiki: broken remastered sprites: {missing_art[:3]}"
        page.locator(".codex-compare").click()
        page.wait_for_function("() => document.querySelector('.codex-compare')?.getAttribute('aria-pressed') === 'true'", timeout=20000)
        assert page.locator("#grid .card img").first.get_attribute("src").startswith("data:image/png;base64,"), "Wiki: original compare unavailable"
        page.locator(".codex-compare").click()
        page.wait_for_function("() => document.querySelector('.codex-compare')?.getAttribute('aria-pressed') === 'false'", timeout=10000)
        assert "sprites-reworked" in page.locator("#grid .card img").first.get_attribute("src"), "Wiki: restored remasters not shown"
        page.locator("#search").fill("Flor")
        assert page.locator("#grid .card").count() > 0, "Wiki: search stopped working"
        page.locator(".cx-clear").click()
        assert page.locator("#search").input_value() == "", "Wiki: clear search failed"
        page.locator(".cx-help-button").click()
        assert page.locator(".cx-help-dialog").evaluate("(d)=>d.open"), "Wiki: help dialog did not open"
        page.locator("#cxCloseHelp").click()
        page.locator(".cx-density").filter(has_text="Grade").click()
        assert page.locator("body").evaluate("(e)=>e.classList.contains('cx-compact')"), "Wiki: compact density failed"
        page.screenshot(path=str(SHOTS / "wiki.png"), full_page=False)
        # Todas as áreas do acervo usam a mesma identidade visual.
        page.goto(f"http://127.0.0.1:{PORT}/assets.html", wait_until="domcontentloaded")
        page.locator("#gallery .card").first.wait_for(timeout=12000)
        assert page.locator("#gallery .card").count() == 9, "Assets: expected nine original frame previews"
        assert page.locator('link[href*="library-rework.css"]').count() == 1, "Assets: design stylesheet absent"
        page.locator('#chosen').select_option('2')
        assert 'frame-03.png' in page.locator('#urlCode').inner_text(), "Assets: frame URL selector broken"
        page.goto(f"http://127.0.0.1:{PORT}/images.html", wait_until="domcontentloaded")
        assert page.locator("#send").count() and page.locator("#files").count(), "Image library: upload tools missing"
        assert page.locator('link[href*="library-rework.css"]').count() == 1, "Image library: design stylesheet absent"

        page.goto(f"http://127.0.0.1:{PORT}/studio.html", wait_until="domcontentloaded")
        page.locator("#cx-panel-arte").wait_for(state="attached", timeout=12000)
        page.locator("#cx-tab-arte").click()
        assert page.locator(".cx-stage-tab").count() == 5, "Studio: 5-step navigation missing"
        page.locator(".cx-help-link").click()
        assert page.locator(".cx-studio-guide").evaluate("(e)=>e.open"), "Studio: guide dialog not working"
        page.locator("#cxGuideClose").click()
        assert page.locator("#visualEditor").count() == 1, "Studio: preview missing"
        assert page.locator("#frames .frame").count() == 10, "Studio: presets missing"
        assert page.locator("#backgrounds .background-option").count() == 11, "Studio: backgrounds missing"
        page.locator("#cx-tab-molduras").click()
        page.locator('.frame[data-frame="1"]').click()
        page.wait_for_function("() => document.querySelector('.frame[data-frame=\"1\"]')?.getAttribute('aria-pressed') === 'true'", timeout=15000)
        frame_alpha = page.evaluate("""() => {
          const c=document.querySelector('#frameOverlay'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
          let visible=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)visible++;return visible;
        }""")
        assert frame_alpha > 500, f"Studio: frame PNG not rendered ({frame_alpha} pixels)"

        page.locator("#cx-tab-fundos").click()
        page.locator('.background-option[data-background="3"]').click()
        assert "background-03.gif" in page.locator("#backgroundPreview").get_attribute("src"), "Studio: original GIF replaced"

        page.locator("#cx-tab-arte").click()
        page.locator("#artFile").set_input_files({"name": "smoke.png", "mimeType": "image/png", "buffer": sample_png()})
        page.wait_for_function("() => !document.querySelector('#source').hidden", timeout=10000)
        with page.expect_download(timeout=15000) as download:
            page.locator("#exportAlpha").click()
        export = download.value
        assert export.suggested_filename.endswith("_transparente.png"), "Studio: transparent PNG export missing"
        page.wait_for_function("""() => {
          const c=document.querySelector('#source'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
          for(let i=3;i<d.length;i+=4)if(d[i]===0)return true;return false;
        }""", timeout=10000)
        with page.expect_download(timeout=15000) as download:
            page.locator("#saveSprite").click()
        assert download.value.suggested_filename.endswith("_sprite_transparente.png"), "Studio: full sprite export broken"
        with page.expect_download(timeout=15000) as download:
            page.locator("#saveCircle").click()
        assert download.value.suggested_filename.endswith("_icone_circular.png"), "Studio: circular icon export broken"

        page.locator("#cx-tab-ficha").click()
        page.locator("#name").fill("Relíquia de Teste")
        page.locator("#cx-tab-salvar").click()
        page.locator("#save").click()
        page.wait_for_function("() => document.querySelector('#status').textContent.includes('salvo')", timeout=12000)
        saved = page.evaluate("() => JSON.parse(localStorage.getItem('codex_studio_items_v1')||'[]')")
        assert saved and saved[0]["name"] == "Relíquia de Teste", "Studio: save failed"
        item_id = saved[0]["id"]
        page.screenshot(path=str(SHOTS / "studio.png"), full_page=False)
        page.goto(f"http://127.0.0.1:{PORT}/studio.html?edit={item_id}", wait_until="domcontentloaded")
        page.wait_for_function("() => document.querySelector('#name')?.value === 'Relíquia de Teste'", timeout=15000)
        # Visual mobile: controles continuam acessíveis e as guias não provocam rolagem da página.
        page.set_viewport_size({"width": 390, "height": 844})
        page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="domcontentloaded")
        page.locator(".cx-welcome").wait_for(timeout=12000)
        assert page.locator("#search").is_visible(), "Mobile wiki: search hidden"
        page.screenshot(path=str(SHOTS / "wiki-mobile.png"), full_page=False)
        page.goto(f"http://127.0.0.1:{PORT}/studio.html", wait_until="domcontentloaded")
        page.locator("#cx-panel-arte").wait_for(state="attached", timeout=12000)
        page.locator("#cx-tab-arte").click()
        assert page.locator("#visualEditor").is_visible(), "Mobile studio: preview inaccessible"
        page.locator("#cx-tab-molduras").click()
        assert page.locator("#frames .frame").count() == 10, "Mobile studio: presets hidden"
        page.screenshot(path=str(SHOTS / "studio-mobile.png"), full_page=False)
        assert not errors, "Browser JS errors:\n" + "\n".join(errors)
        print("PASS: wiki navigation/search/density/help; frame gallery and asset library; studio tabs/guide/frames/GIF, PNG exports, saved/reopened item")
    except Exception:
        page.screenshot(path=str(SHOTS / "failure.png"), full_page=False)
        print("JS ERRORS:", json.dumps(errors, ensure_ascii=False))
        raise
    finally:
        context.close()
        browser.close()
        httpd.shutdown()
