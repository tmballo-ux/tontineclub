from PIL import Image, ImageDraw, ImageFont
import os
import math

OUTPUT_DIR = "/app/frontend/assets/playstore"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_font(size):
    """Try to get a good font, fallback to default."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            return ImageFont.truetype(fp, size)
    return ImageFont.load_default()

def get_font_regular(size):
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            return ImageFont.truetype(fp, size)
    return ImageFont.load_default()

def create_gradient(draw, width, height, color1, color2, direction='vertical'):
    """Create a smooth gradient."""
    for i in range(height):
        r = int(color1[0] + (color2[0] - color1[0]) * i / height)
        g = int(color1[1] + (color2[1] - color1[1]) * i / height)
        b = int(color1[2] + (color2[2] - color1[2]) * i / height)
        draw.line([(0, i), (width, i)], fill=(r, g, b))

def draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2*radius, y0 + 2*radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2*radius, y0, x1, y0 + 2*radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2*radius, x0 + 2*radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2*radius, y1 - 2*radius, x1, y1], 0, 90, fill=fill)

def draw_shield(draw, cx, cy, size, fill):
    """Draw a shield icon."""
    points = [
        (cx, cy - size),  # top
        (cx + size * 0.75, cy - size * 0.55),  # top right
        (cx + size * 0.75, cy + size * 0.1),  # right
        (cx, cy + size),  # bottom point
        (cx - size * 0.75, cy + size * 0.1),  # left
        (cx - size * 0.75, cy - size * 0.55),  # top left
    ]
    draw.polygon(points, fill=fill)

def draw_checkmark(draw, cx, cy, size, fill, width=3):
    """Draw a checkmark."""
    points = [
        (cx - size * 0.4, cy),
        (cx - size * 0.1, cy + size * 0.3),
        (cx + size * 0.4, cy - size * 0.3),
    ]
    draw.line(points, fill=fill, width=width)

def draw_diamond(draw, cx, cy, size, fill):
    """Draw a diamond shape."""
    points = [
        (cx, cy - size),
        (cx + size * 0.6, cy),
        (cx, cy + size),
        (cx - size * 0.6, cy),
    ]
    draw.polygon(points, fill=fill)

# ============================================================
# 1. APP ICON (512x512)
# ============================================================

def create_app_icon():
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background - rounded square with gradient effect
    bg_img = Image.new('RGB', (size, size))
    bg_draw = ImageDraw.Draw(bg_img)
    create_gradient(bg_draw, size, size, (37, 99, 235), (59, 130, 246))  # Blue gradient
    
    # Create rounded mask
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = 100
    draw_rounded_rect(mask_draw, (0, 0, size-1, size-1), radius, 255)
    
    img.paste(bg_img, (0, 0), mask)
    draw = ImageDraw.Draw(img)
    
    # Shield icon
    shield_cy = 200
    shield_size = 110
    draw_shield(draw, 256, shield_cy, shield_size, (255, 255, 255, 60))
    draw_shield(draw, 256, shield_cy, shield_size - 12, (255, 255, 255, 100))
    
    # Checkmark inside shield
    draw_checkmark(draw, 256, shield_cy + 5, shield_size * 0.5, (255, 255, 255, 255), width=14)
    
    # "TC" text
    font_tc = get_font(120)
    text = "TC"
    bbox = draw.textbbox((0, 0), text, font=font_tc)
    tw = bbox[2] - bbox[0]
    draw.text(((size - tw) / 2, 300), text, fill=(255, 255, 255), font=font_tc)
    
    # Save
    output = os.path.join(OUTPUT_DIR, "app_icon_512.png")
    img.save(output, 'PNG')
    print(f"Created: {output}")

# ============================================================
# 2. ADAPTIVE ICON FOREGROUND (432x432 centered in 512x512)
# ============================================================

def create_adaptive_icon():
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Shield
    shield_cy = 195
    shield_size = 100
    draw_shield(draw, 256, shield_cy, shield_size, (255, 255, 255, 255))
    draw_checkmark(draw, 256, shield_cy + 5, shield_size * 0.45, (37, 99, 235), width=12)
    
    # "TC" 
    font_tc = get_font(110)
    text = "TC"
    bbox = draw.textbbox((0, 0), text, font=font_tc)
    tw = bbox[2] - bbox[0]
    draw.text(((size - tw) / 2, 295), text, fill=(255, 255, 255), font=font_tc)
    
    output = os.path.join(OUTPUT_DIR, "adaptive_foreground.png")
    img.save(output, 'PNG')
    print(f"Created: {output}")

# ============================================================
# 3. FEATURE GRAPHIC (1024x500)
# ============================================================

def create_feature_graphic():
    w, h = 1024, 500
    img = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)
    
    # Blue gradient background
    create_gradient(draw, w, h, (30, 64, 175), (59, 130, 246))
    
    # Decorative circles (subtle)
    for cx, cy, r, alpha in [(180, 100, 200, 15), (850, 400, 250, 12), (500, 450, 180, 10)]:
        overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255, 255, 255, alpha))
        img = Image.alpha_composite(img.convert('RGBA'), overlay)
    
    draw = ImageDraw.Draw(img)
    
    # Shield icon on the left
    shield_cx = 220
    shield_cy = 230
    shield_size = 90
    draw_shield(draw, shield_cx, shield_cy, shield_size, (255, 255, 255, 80))
    draw_shield(draw, shield_cx, shield_cy, shield_size - 10, (255, 255, 255, 140))
    draw_checkmark(draw, shield_cx, shield_cy + 5, shield_size * 0.45, (255, 255, 255, 255), width=10)
    
    # Title text
    font_title = get_font(64)
    font_sub = get_font_regular(28)
    font_tag = get_font(22)
    
    tx = 380
    draw.text((tx, 120), "TontineClub", fill=(255, 255, 255), font=font_title)
    
    # Tagline
    draw.text((tx, 210), "Gérez vos tontines en toute", fill=(255, 255, 255, 200), font=font_sub)
    draw.text((tx, 250), "sécurité et transparence", fill=(255, 255, 255, 200), font=font_sub)
    
    # Feature badges
    badges = ["Sécurisé", "Transparent", "Simple"]
    badge_x = tx
    for badge_text in badges:
        bbox = draw.textbbox((0, 0), badge_text, font=font_tag)
        bw = bbox[2] - bbox[0] + 24
        draw_rounded_rect(draw, (badge_x, 320, badge_x + bw, 358), 12, (255, 255, 255, 50))
        draw.text((badge_x + 12, 325), badge_text, fill=(255, 255, 255), font=font_tag)
        badge_x += bw + 16
    
    # Bottom text
    font_bottom = get_font_regular(18)
    draw.text((tx, 410), "Essai gratuit de 7 jours • 3 $ USD / mois", fill=(255, 255, 255, 180), font=font_bottom)
    
    # Save as RGB
    output = os.path.join(OUTPUT_DIR, "feature_graphic_1024x500.png")
    img.convert('RGB').save(output, 'PNG')
    print(f"Created: {output}")

# ============================================================
# 4. SCREENSHOTS MOCKUPS (Phone frame 1080x1920)
# ============================================================

def create_screenshot(title, subtitle, features, filename, bg_color1, bg_color2):
    w, h = 1080, 1920
    img = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)
    create_gradient(draw, w, h, bg_color1, bg_color2)
    
    font_title = get_font(56)
    font_sub = get_font_regular(32)
    font_feature = get_font(28)
    font_feature_desc = get_font_regular(24)
    
    # Title
    bbox = draw.textbbox((0, 0), title, font=font_title)
    tw = bbox[2] - bbox[0]
    draw.text(((w - tw) / 2, 120), title, fill=(255, 255, 255), font=font_title)
    
    # Subtitle
    bbox = draw.textbbox((0, 0), subtitle, font=font_sub)
    tw = bbox[2] - bbox[0]
    draw.text(((w - tw) / 2, 200), subtitle, fill=(255, 255, 255, 200), font=font_sub)
    
    # Phone mockup area (white rounded rect)
    phone_x = 80
    phone_y = 320
    phone_w = w - 160
    phone_h = h - 440
    draw_rounded_rect(draw, (phone_x, phone_y, phone_x + phone_w, phone_y + phone_h), 40, (255, 255, 255))
    
    # Features inside "phone"
    y_offset = phone_y + 80
    for i, (feat_title, feat_desc) in enumerate(features):
        # Icon circle
        cx = phone_x + 80
        cy = y_offset + 25
        draw.ellipse([cx-25, cy-25, cx+25, cy+25], fill=bg_color1)
        
        # Feature text
        draw.text((cx + 45, y_offset), feat_title, fill=(30, 30, 30), font=font_feature)
        draw.text((cx + 45, y_offset + 38), feat_desc, fill=(120, 120, 120), font=font_feature_desc)
        
        y_offset += 110
    
    output = os.path.join(OUTPUT_DIR, filename)
    img.save(output, 'PNG')
    print(f"Created: {output}")

# ============================================================
# GENERATE ALL
# ============================================================

print("Generating Play Store assets...")
print()

create_app_icon()
create_adaptive_icon()
create_feature_graphic()

# Screenshot 1 - Dashboard
create_screenshot(
    "TontineClub",
    "Votre tableau de bord financier",
    [
        ("Résumé financier", "Contribué, reçu et solde en un coup d'œil"),
        ("Tontines actives", "Suivez toutes vos tontines en temps réel"),
        ("Notifications", "Alertes de paiement et rappels"),
        ("Membres", "Gérez les participants facilement"),
        ("Sécurité", "Fonds suivis et transparents"),
        ("Progression", "Barres de progression visuelles"),
    ],
    "screenshot_1_dashboard.png",
    (37, 99, 235), (96, 165, 250)
)

# Screenshot 2 - Tontines
create_screenshot(
    "Mes Tontines",
    "Gérez vos groupes d'épargne",
    [
        ("Cartes détaillées", "Membres, cagnotte, cotisation, échéance"),
        ("Actions rapides", "Payer, inviter, voir les détails"),
        ("Barre de progression", "Suivez l'avancement de chaque cycle"),
        ("Filtres & tri", "Trouvez rapidement vos tontines"),
        ("Score de fiabilité", "Suivi des paiements à temps"),
        ("Multi-devises", "CAD, USD, FCFA, EUR"),
    ],
    "screenshot_2_tontines.png",
    (5, 150, 105), (16, 185, 129)
)

# Screenshot 3 - Invitations
create_screenshot(
    "Invitations",
    "Rejoignez des tontines en confiance",
    [
        ("Détails complets", "Voyez toutes les infos avant d'accepter"),
        ("Accepter / Refuser", "Actions claires et sécurisées"),
        ("Membres existants", "Voir qui participe déjà"),
        ("Confirmation", "Double validation avant engagement"),
        ("Indicateurs de confiance", "Paiements suivis, transparent"),
        ("Historique", "Retrouvez vos invitations passées"),
    ],
    "screenshot_3_invitations.png",
    (124, 58, 237), (167, 139, 250)
)

# Screenshot 4 - Sécurité
create_screenshot(
    "Sécurité & Confiance",
    "Vos données sont protégées",
    [
        ("Chiffrement", "Mots de passe et données sécurisés"),
        ("Traçabilité", "Historique complet des transactions"),
        ("Confidentialité", "Données jamais vendues à des tiers"),
        ("Suppression de compte", "Contrôle total de vos données"),
        ("Notifications", "Alertes en temps réel"),
        ("Play Store compliant", "Conforme aux règles Google"),
    ],
    "screenshot_4_security.png",
    (217, 119, 6), (245, 158, 11)
)

print()
print("All assets generated!")
print(f"Output directory: {OUTPUT_DIR}")
