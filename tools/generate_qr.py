"""Generate a permanent, local QR code and verify it with an independent decoder."""
from pathlib import Path
import cv2
import qrcode
import qrcode.image.svg

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://chromahud1.github.io/'
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, box_size=48, border=4)
qr.add_data(URL); qr.make(fit=True)
png = qr.make_image(fill_color='black', back_color='white')
png.save(ROOT / 'portfolio-qr.png', dpi=(600,600))
qr.make_image(image_factory=qrcode.image.svg.SvgPathFillImage).save(ROOT / 'portfolio-qr.svg')
image = cv2.imread(str(ROOT / 'portfolio-qr.png'))
image = cv2.resize(image, (888,888), interpolation=cv2.INTER_NEAREST)
decoded, _, _ = cv2.QRCodeDetector().detectAndDecode(image)
if decoded != URL:
    raise RuntimeError('QR verification did not decode to the expected URL.')
(ROOT / 'portfolio-qr-url.txt').write_text(URL + '\n', encoding='utf-8')
print(f'PNG: {ROOT / "portfolio-qr.png"} ({png.size[0]} x {png.size[1]} pixels)')
print(f'SVG: {ROOT / "portfolio-qr.svg"}')
print(f'Independent OpenCV decode passed: {decoded}')
