import json
import os

shades_database = []

# --- SWISS BEAUTY ---
# High Performance Liquid Foundation (Price: ₹322)
sb_hp_shades = [
    ("White Ivory", [90.73, 3.34, 6.1], "#f0e2d9", "2025-02-15"),
    ("Rose Blush", [85.52, 10.15, 4.86], "#edcfcd", "2025-02-18"),
    ("Natural Beige", [84.38, 10.59, 12.85], "#f0cbbb", "2025-03-01"),
    ("Natural Nude", [85.53, 12.93, 22.51], "#fdccac", "2025-01-20"),
    ("Classic Ivory", [86.05, 10.26, 26.36], "#fccfa6", "2025-04-10"),
    ("Medium Beige", [80.04, 11.88, 28.43], "#eebd92", "2025-05-12"),
    ("Natural Buff", [74.78, 9.77, 27.35], "#dbb086", "2025-06-02"),
    ("Sun Beige", [70.34, 16.05, 33.52], "#daa070", "2025-06-15")
]

for name, lab, hex_val, date in sb_hp_shades:
    shades_database.append({
        "brand": "Swiss Beauty",
        "product": "High Performance Liquid Foundation",
        "shade": name,
        "name": f"High Performance - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 322,
        "date_added": date
    })

# Cover & Blend Foundation Stick (Price: ₹277)
sb_cb_shades = [
    ("Pretty Vanilla", [78.03, 5.47, 27.18], "#ddbc8f", "2024-11-10"),
    ("Fair Buff", [80.57, 4.04, 23.76], "#e0c49c", "2024-12-05"),
    ("Shell Beige", [75.3, 9.6, 23.37], "#dab28f", "2025-01-14"),
    ("Almond Beige", [75.57, 8.83, 28.43], "#dcb386", "2025-02-28"),
    ("Silly Golden", [75.29, 9.43, 29.27], "#ddb284", "2025-03-22"),
    ("Sandalwood", [69.22, 16.7, 37.1], "#d99c66", "2025-05-01")
]

for name, lab, hex_val, date in sb_cb_shades:
    shades_database.append({
        "brand": "Swiss Beauty",
        "product": "Cover & Blend Foundation Stick",
        "shade": name,
        "name": f"Cover & Blend Stick - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 277,
        "date_added": date
    })


# --- LAKME 9TO5 ---
# Lakme 9to5 Foundation (Price: ₹594 / ₹455 / ₹550)
lakme_shades = [
    ("C100 Cool Ivory", [72.86, 16.24, 23.91], "#dea788", 594, "2024-08-12", "Cool"),
    ("W120 Warm Creme", [78.01, 11.40, 27.79], "#e7b88e", 594, "2024-09-01", "Warm"),
    ("C140 Cool Rose", [72.15, 16.41, 23.46], "#dca587", 455, "2024-09-15", "Cool"),
    ("W160 Warm Sand", [73.78, 17.90, 30.14], "#e6a87f", 455, "2024-10-10", "Warm"),
    ("N200 Neutral Nude", [71.71, 12.87, 27.65], "#d7a67e", 455, "2024-11-20", "Neutral"),
    ("N220 Neutral Medium", [72.04, 14.18, 27.60], "#daa67f", 455, "2024-12-01", "Neutral"),
    ("W240 Warm Beige", [71.39, 14.53, 28.34], "#d9a47c", 455, "2025-01-05", "Warm"),
    ("N260 Neutral Honey", [82.19, 10.08, 16.57], "#ebc5ae", 455, "2025-01-25", "Neutral"),
    ("C280 Cool Tan", [66.65, 20.53, 32.87], "#d69368", 455, "2025-02-14", "Cool"),
    ("C300 Cool Cinnamon", [71.66, 18.21, 32.07], "#e1a276", 455, "2025-03-08", "Cool"),
    ("W320 Warm Caramel", [65.35, 16.90, 36.38], "#ce925e", 455, "2025-03-29", "Warm"),
    ("N340 Neutral Almond", [78.03, 9.35, 16.99], "#debaa2", 455, "2025-04-12", "Neutral"),
    ("N360 Neutral Chestnut", [60.50, 22.91, 38.26], "#c9814f", 455, "2025-05-02", "Neutral"),
    ("C390 Cool Cocoa", [51.93, 21.18, 25.64], "#aa6d51", 455, "2025-06-01", "Cool"),
    ("C380 Cool Walnut", [66.65, 20.53, 32.87], "#d69368", 455, "2025-06-11", "Cool"),
    ("W110 Warm Light", [78.09, 18.43, 36.08], "#f6b37f", 455, "2025-06-25", "Warm"),
    ("N150 Neutral Light", [62.67, 18.90, 27.35], "#c68a68", 550, "2025-07-02", "Neutral"),
    ("W230 Warm Wood", [57.97, 23.40, 41.36], "#c37a43", 455, "2025-07-10", "Warm")
]

for name, lab, hex_val, price, date, undertone in lakme_shades:
    shades_database.append({
        "brand": "Lakme 9to5",
        "product": "Lakme 9to5 Foundation",
        "shade": name,
        "name": name,
        "lab": lab,
        "hex": hex_val,
        "price": price,
        "date_added": date,
        "undertone": undertone
    })


# --- HUDA BEAUTY ---
# #FauxFilter Luminous Matte Foundation (Price: ₹3,650)
huda_ff_shades = [
    ("Butter Pecan", [70.34, 21.49, 34.68], "#E39C6E", "2024-05-14"),
    ("Baklava 340G", [72.79, 17.81, 38.37], "#E6A56D", "2024-05-20"),
    ("Milkshake 100B", [89.78, 7.3, 16.37], "#FCDCC3", "2024-06-01"),
    ("Angel Food 110N", [89.73, 5.22, 19.4], "#FADDBD", "2024-06-15"),
    ("Vanilla 120B", [89.71, 6.42, 22.55], "#FEDCB7", "2024-07-01"),
    ("Cashew 140G", [85.79, 9.24, 25.43], "#F9CFA7", "2024-07-12"),
    ("Creme Brulee 150G", [86.85, 7.34, 29.51], "#FBD3A2", "2024-08-03"),
    ("Shortbread 200B", [85.51, 10.95, 27.19], "#FCCDA3", "2024-08-20"),
    ("Chai 210B", [79.8, 12.4, 32.44], "#F0BC8A", "2024-09-02"),
    ("Custard 220N", [78.87, 17.53, 31.13], "#F5B68A", "2024-09-18"),
    ("Macaroon 230N", [80.29, 15.58, 35.84], "#F8BB85", "2024-10-01"),
    ("Toasted Coconut 240N", [77.41, 15.76, 36.65], "#F0B37C", "2024-10-15"),
    ("Cheesecake 250G", [78.33, 16.66, 33.71], "#F3B584", "2024-11-01"),
    ("Apple Pie 255B", [77.03, 20.05, 35.21], "#F5AF7E", "2024-11-12"),
    ("Cream Puff 260W", [78.05, 18.15, 37.58], "#F6B37C", "2024-12-01"),
    ("Latte 300N", [71.51, 17.52, 33.45], "#E0A273", "2024-12-15"),
    ("Iced Frappe 305C", [72.32, 16.5, 31.13], "#E0A579", "2025-01-02"),
    ("Golden Milk 307N", [71.51, 17.29, 37.17], "#E1A26C", "2025-01-10"),
    ("Amaretti 310G", [71.64, 16.35, 37.31], "#E0A36C", "2025-01-20"),
    ("Tres Leches 320G", [70.72, 17.23, 35.57], "#DEA06D", "2025-02-01"),
    ("Dulce De Leche 350G", [72, 18.7, 44.61], "#E7A25F", "2025-02-15"),
    ("Creme Caramel 355W", [69.74, 18.73, 43.75], "#E09C5B", "2025-03-01"),
    ("Macchiato 400G", [68.46, 21.07, 41.67], "#DF975C", "2025-03-12"),
    ("Toffee 420G", [65.39, 20.87, 43.4], "#D68F51", "2025-03-20"),
    ("Pistachio Cream 425N", [66.1, 22.29, 39.17], "#D9905B", "2025-04-01"),
    ("Gingerbread 430N", [63.25, 24.22, 41.86], "#D4874F", "2025-04-10"),
    ("Cinnamon 440G", [62, 26.35, 45], "#D48246", "2025-04-20"),
    ("Chocolate Mousse 450G", [52.05, 25.99, 41.39], "#B56935", "2025-05-01"),
    ("Peanut Butter 455R", [41.4, 20.63, 40.43], "#8F531D", "2025-05-15"),
    ("Mocha 500G", [42.5, 17.63, 33.98], "#8D582C", "2025-05-25"),
    ("Cocoa 510R", [42.17, 17.22, 20.88], "#885842", "2025-06-01"),
    ("Hot Fudge 550R", [35.41, 15.94, 16.96], "#734939", "2025-06-10"),
    ("Ganache 560R", [30.74, 15.11, 11.59], "#643F37", "2025-06-20"),
    ("Chocolate Swirl 570W", [23.44, 19.58, 19.82], "#592B1B", "2025-06-30"),
    ("Truffle Cake 580N", [19.39, 14.64, 14.86], "#48261A", "2025-07-02"),
    ("True Lava Cake 590R", [26.87, 16.74, 13.97], "#5D352B", "2025-07-05"),
    ("Molten Cocoa 595R", [10.93, 9.91, 4.94], "#2C1817", "2025-07-08"),
    ("Espresso 600N", [23.37, 6.43, 7.36], "#45342D", "2025-07-12")
]

for name, lab, hex_val, date in huda_ff_shades:
    shades_database.append({
        "brand": "Huda Beauty",
        "product": "#FauxFilter Luminous Matte Foundation",
        "shade": name,
        "name": f"#FauxFilter - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 3650,
        "date_added": date,
        "finish": "Luminous Matte",
        "coverage": "Full"
    })

# HUDA BEAUTY EASY BLUR FOUNDATION (Price: $54 -> ₹4,500)
# We have 38 shades
huda_eb_shades = [
    ("Butter pecan 330N", [70.34, 21.49, 34.68], "#E39C6E"),
    ("Baklava 340G", [72.79, 17.81, 38.37], "#E6A56D"),
    ("Milkshake 100B", [89.78, 7.3, 16.37], "#FCDCC3"),
    ("Angel food 110N", [89.73, 5.22, 19.4], "#FADDBD"),
    ("Vanilla 120B", [89.71, 6.42, 22.55], "#FEDCB7"),
    ("Cashew 140G", [85.79, 9.24, 25.43], "#F9CFA7"),
    ("Creme Brulee 150G", [86.85, 7.34, 29.51], "#FBD3A2"),
    ("Shortbread 200B", [85.51, 10.95, 27.19], "#FCCDA3"),
    ("Chai 210B", [79.8, 12.4, 32.44], "#F0BC8A"),
    ("Custard 220N", [78.87, 17.53, 31.13], "#F5B68A"),
    ("Macaroon 230N", [80.29, 15.58, 35.84], "#F8BB85"),
    ("Toasted Coconut 240N", [77.41, 15.76, 36.65], "#F0B37C"),
    ("Cheesecake 250G", [78.33, 16.66, 33.71], "#F3B584"),
    ("Apple pie 255B", [77.03, 20.05, 35.21], "#F5AF7E"),
    ("Cream puff 260W", [78.05, 18.15, 37.58], "#F6B37C"),
    ("Latte 300N", [71.51, 17.52, 33.45], "#E0A273"),
    ("Iced Frappe 305C", [72.32, 16.5, 31.13], "#E0A579"),
    ("Golden Milk 307N", [71.51, 17.29, 37.17], "#E1A26C"),
    ("Amaretti 310G", [71.64, 16.35, 37.31], "#E0A36C"),
    ("Tres Leches 320G", [70.72, 17.23, 35.57], "#DEA06D"),
    ("Dulce De Leche 350G", [72, 18.7, 44.61], "#E7A25F"),
    ("Creme Caramel 355W", [69.74, 18.73, 43.75], "#E09C5B"),
    ("Macchiato 400G", [68.46, 21.07, 41.67], "#DF975C"),
    ("Toffee 420G", [65.39, 20.87, 43.4], "#D68F51"),
    ("Pistachio cream 425N", [66.1, 22.29, 39.17], "#D9905B"),
    ("Gingerbread 430N", [63.25, 24.22, 41.86], "#D4874F"),
    ("Cinnamon 440G", [62, 26.35, 45], "#D48246"),
    ("Chocolate mousse 450G", [52.05, 25.99, 41.39], "#B56935"),
    ("Peanut butter 455R", [41.4, 20.63, 40.43], "#8F531D"),
    ("Mocha 500G", [42.5, 17.63, 33.98], "#8D582C"),
    ("cocoa 510R", [42.17, 17.22, 20.88], "#885842"),
    ("Hot Fudge 550R", [35.41, 15.94, 16.96], "#734939"),
    ("Ganache 560R", [30.74, 15.11, 11.59], "#643F37"),
    ("Chocolate Swirl 570W", [23.44, 19.58, 19.82], "#592B1B"),
    ("Truffle Cake 580N", [19.39, 14.64, 14.86], "#48261A"),
    ("True Lava Cake 590R", [26.87, 16.74, 13.97], "#5D352B"),
    ("Molten Cocoa 595R", [10.93, 9.91, 4.94], "#2C1817"),
    ("Espresso 600N", [23.37, 6.43, 7.36], "#45342D")
]

for name, lab, hex_val in huda_eb_shades:
    # Deduce undertone from letters G (Golden), N (Neutral), B (Beige/Cool), R (Red/Cool), C (Cool), W (Warm)
    undertone = "Neutral"
    if "G" in name: undertone = "Warm Golden"
    elif "B" in name: undertone = "Cool Pink"
    elif "N" in name: undertone = "Neutral"
    elif "R" in name: undertone = "Cool Red"
    elif "W" in name: undertone = "Warm"
    elif "C" in name: undertone = "Cool"
    shades_database.append({
        "brand": "Huda Beauty",
        "product": "Easy Blur Foundation",
        "shade": name,
        "name": f"Easy Blur - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 4500,
        "date_added": "2026-07-14",
        "finish": "Blurring Matte",
        "coverage": "Medium to Full",
        "undertone": undertone
    })


# --- MAC COSMETICS ---
# Studio Fix Fluid SPF 15 (Price: ₹4,000, 43 shades)
mac_shades = [
    ("NC 5", [79.67, 9.89, 19.37], "#E5BEA2"),
    ("NW10", [83.45, 9.11, 18.37], "#EEC9AE"),
    ("NC12", [85.11, 4.32, 13.2], "#E7D1BC"),
    ("NC13", [85.45, 6.44, 23.3], "#F2D0AA"),
    ("NC15", [75.13, 10.04, 29.09], "#DDB184"),
    ("NC20", [69.67, 11.97, 30.76], "#D1A173"),
    ("NC25", [69.18, 14.41, 32.33], "#D49E6F"),
    ("NC30", [70.28, 8.53, 27.71], "#CCA57A"),
    ("NC35", [67.46, 13.72, 29.94], "#CD9A6F"),
    ("NC37", [65.06, 14.69, 31.06], "#C89367"),
    ("NC40", [63.94, 13.4, 28.93], "#C29168"),
    ("NC42", [64.23, 15.76, 33.24], "#C89061"),
    ("NC44", [61.49, 14.47, 27.26], "#BC8A65"),
    ("NC45", [59.73, 16.39, 30.47], "#BB845B"),
    ("NC45.5", [58.15, 11.99, 27.62], "#AF835C"),
    ("NC46", [55.7, 15.89, 31.12], "#AF7A50"),
    ("NW13", [79.21, 9.27, 21.93], "#E4BD9C"),
    ("N4.5", [76.01, 8.52, 17.31], "#D7B59C"),
    ("N4.75", [79.27, 6.7, 18.73], "#DEBFA2"),
    ("NC16", [76.38, 8.09, 22.17], "#DAB694"),
    ("NC17", [70.69, 8.74, 26.65], "#CDA67D"),
    ("NC18", [72.7, 12.39, 27.4], "#D9A981"),
    ("NW15", [75.08, 7.01, 25.17], "#D6B38B"),
    ("NW18", [72.7, 12.39, 27.4], "#D9A981"),
    ("C40", [81.6898, 7.0019, 26.98], "#eac599"),
    ("NW20", [65.8879, 12.4544, 23.8789], "#c49776"),
    ("N6", [70.58, 11.42, 26.58], "#d1a47d"),
    ("C3.5", [76.8963, 9.86, 27.26], "#e1b68c"),
    ("N6.5", [74.4839, 10.8413, 23.89], "#daaf8c"),
    ("NC38", [65.2486, 9.3827, 30.05], "#c09769"),
    ("C4.5", [78.14, 12.02, 26.93], "#e8b890"),
    ("C45", [71.88, 5.36, 33.57], "#ceab73"),
    ("C55", [41.71, 15.22, 27.27], "#865836"),
    ("NW35", [59.04, 15.36, 28.95], "#b7835c"),
    ("NW43", [42.01, 17.76, 26.60], "#8a5738"),
    ("NW44", [33.96, 15.22, 19.28], "#6f4632"),
    ("NW45", [37.63, 15.76, 24.84], "#7b4e31"),
    ("NW47", [33.39, 14.38, 25.16], "#6e4527"),
    ("NW48", [34.19, 17.26, 22.12], "#73452e"),
    ("NW50", [35.90, 15.71, 23.74], "#764a2f"),
    ("NC55", [27.56, 14.35, 18.08], "#5d3826"),
    ("NW57", [19.94, 8.72, 13.39], "#422b1d"),
    ("NW60", [15.95, 8.23, 9.90], "#37231a")
]

for name, lab, hex_val in mac_shades:
    undertone = "Neutral"
    if name.startswith("NC"): undertone = "Neutral Cool (Golden/Yellow)"
    elif name.startswith("NW"): undertone = "Neutral Warm (Pink/Peach)"
    elif name.startswith("N"): undertone = "Neutral"
    elif name.startswith("C"): undertone = "Cool (Olive/Golden)"
    
    shades_database.append({
        "brand": "MAC Cosmetics",
        "product": "Studio Fix Fluid SPF 15",
        "shade": name,
        "name": f"Studio Fix Fluid - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 4000,
        "date_added": "2026-07-14",
        "spf": 15,
        "undertone": undertone,
        "finish": "Natural Matte",
        "coverage": "Full"
    })


# --- DAILY LIFE FOREVER52 ---
# Sensational Foundation SPF 50 (Price: 637)
dl_sf_shades = [
    ("CREAM CALTANA", [88.6, 0.1, 8.8], "#E5DBCA"),
    ("GINGER", [50.14, 24.48, 58.05], "#B06500"),
    ("Biscuit-sns-106", [60.9, 16.5, 28.5], "#B4835B"),
    ("ICON", [61.5, -2.3, -52.1], "#2296F3"),
    ("KHAKI", [90.33, -9.01, 44.97], "#F0E68C"),
    ("MANGO", [80.58, 10.07, 82.43], "#FDBE02"),
    ("WHITE PEACH", [91.95, 1.80, 27.18], "#F5EADD"),
    ("MEDIUM SAND", [69.3, 4.7, 23.9], "#BDA383")
]

for name, lab, hex_val in dl_sf_shades:
    shades_database.append({
        "brand": "Daily Life Forever52",
        "product": "Sensational Foundation SPF 50",
        "shade": name,
        "name": f"Sensational Foundation - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 637,
        "date_added": "2026-07-14",
        "spf": 50,
        "coverage": "Full",
        "finish": "Matte"
    })

# Ultra Definition Liquid Foundation (Price: 967)
dl_ud_shades = [
    ("Caramel-FLF004", [63.5, 18.5, 33.0], "#C4875E"),
    ("Brownie-FLF003", [43.9, 18.5, 25.0], "#8A5A3A"),
    ("Cheese-Cake-FLF011", [81.9, 6.1, 20.6], "#E4C5A4"),
    ("Chestnut-FLF016", [34.9, 14.2, 18.1], "#6F4931"),
    ("Chocolate-Mousse-FLF008", [65.8, 14.6, 16.8], "#BF8D7C"),
    ("Cream Beige (010)", [87.7, 2.2, 16.7], "#EEDCC4"),
    ("Cream Pie", [90.2, 1.6, 16.9], "#F3E1C8"),
    ("Custard (FLF012)", [74.6, 12.2, 22.8], "#D7AB8A"),
    ("Eclair (FLF002)", [37.6, 15.4, 18.6], "#7A4F34"),
    ("Espresso (FLF018)", [17.9, 9.2, 9.6], "#3C2218"),
    ("Fudge (FLF013)", [49.9, 18.2, 28.0], "#9B6846"),
    ("Honey (FLF014)", [76.0, 12.2, 26.8], "#DDB089"),
    ("Milk Cake (FLF005)", [85.7, 7.1, 20.3], "#E9C9AA"),
    ("Parlines Cake (FLF006)", [66.9, 14.6, 28.7], "#C99671"),
    ("Pecan (FLF015)", [55.0, 19.3, 27.5], "#B27652"),
    ("Smoke (FLF019)", [14.9, 8.3, 7.8], "#2F1B14"),
    ("Soleil (FLF017)", [21.9, 12.0, 12.2], "#4E2E1F"),
    ("Sundae (FLF007)", [69.9, 12.9, 27.8], "#CCA17E")
]

for name, lab, hex_val in dl_ud_shades:
    shades_database.append({
        "brand": "Daily Life Forever52",
        "product": "Ultra Definition Liquid Foundation",
        "shade": name,
        "name": f"Ultra Definition - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 967,
        "date_added": "2026-07-14",
        "coverage": "High",
        "finish": "Satin / Natural"
    })

# Spotlight Glow Stick Foundation (Price: 1062)
dl_sg_shades = [
    ("Millet", [57.5, 10.4, 21.8], "#A88463"),
    ("Oats", [82.1, 7.8, 24.7], "#E2C39C"),
    ("Pearl Barley", [63.2, 17.2, 31.0], "#C89261"),
    ("Spelt", [41.9, 12.0, 16.3], "#7E5E49"),
    ("Wheat", [74.0, 14.1, 27.5], "#D9AB7F")
]

for name, lab, hex_val in dl_sg_shades:
    shades_database.append({
        "brand": "Daily Life Forever52",
        "product": "Spotlight Glow Stick Foundation",
        "shade": name,
        "name": f"Spotlight Glow Stick - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 1062,
        "date_added": "2026-07-14",
        "finish": "Glow / Dewy",
        "coverage": "Medium"
    })

# Coverup Foundation Cream (Price: 1784)
dl_cu_shades = [
    ("Acajou (20.7)", [23.0, 10.1, 9.0], "#4C2F27"),
    ("Amber (30.4)", [81.0, 10.4, 83.0], "#FFBF00"),
    ("Biscuit (20.2)", [70.2, 14.6, 29.3], "#D2A074"),
    ("Bronze (20.5)", [60.2, 24.0, 52.3], "#CD7F32"),
    ("Caramel (10.3)", [86.8, 7.9, 35.6], "#FFD59A"),
    ("Cola (30.2)", [41.6, 13.6, 16.8], "#6D4C38"),
    ("Creme (20.3)", [98.5, -6.5, 21.8], "#FFFDD0"),
    ("Desert (20.1)", [82.6, 8.7, 19.9], "#E2C2A5"),
    ("Maron (30.3)", [25.5, 48.0, 38.0], "#800000"),
    ("Milk-Shake (10.1)", [89.1, 6.2, 16.2], "#EED7C3"),
    ("Olive (30.1)", [51.4, -11.7, 55.9], "#808000"),
    ("Sable (10.4)", [74.5, 8.4, 14.7], "#C9AC95"),
    ("Satin (20.4)", [86.2, 6.2, 15.9], "#E8D1BC"),
    ("Sugar (10.2)", [87.3, 6.5, 19.1], "#EFD2B6"),
    ("Toast (20.6)", [68.6, 15.2, 24.6], "#C79B7A")
]

for name, lab, hex_val in dl_cu_shades:
    shades_database.append({
        "brand": "Daily Life Forever52",
        "product": "Coverup Foundation Cream",
        "shade": name,
        "name": f"Coverup - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 1784,
        "date_added": "2026-07-14",
        "coverage": "Maximum Full",
        "finish": "Velvet Matte"
    })


# --- SUGAR COSMETICS ---
# Drop The Base Serum Foundation (9 shades, variable prices)
sugar_db_shades = [
    ("10 Latte", [90, 2, 10], "#FFDCB4", 999),
    ("15 Cappuccino", [85, 5, 12], "#F0C8A0", 899),
    ("17 Raf", [80, 10, 15], "#EBBE96", 799),
    ("27 Vienna", [75, 15, 20], "#E1B48C", 509),
    ("32 Cortado", [70, 20, 25], "#D7AA82", 764),
    ("37 Freddo", [65, 25, 30], "#CD9F78", 899),
    ("42 Glace", [60, 30, 35], "#C3966E", 899),
    ("50 Mocha", [55, 35, 40], "#B98C64", 540),
    ("52 Corretto", [50, 40, 45], "#AF825A", 799)
]

for name, lab, hex_val, price in sugar_db_shades:
    shades_database.append({
        "brand": "SUGAR Cosmetics",
        "product": "Drop The Base Serum Foundation",
        "shade": name,
        "name": f"Drop The Base - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": price,
        "date_added": "2026-07-14",
        "finish": "Serum Semi-Dewy",
        "coverage": "Light to Medium"
    })

# Ace Of Face Foundation Stick (20 shades, Price: 1149)
sugar_af_shades = [
    ("07 Vanilla Latte", [95, 5, 10], "#FFE6C8"),
    ("10 Latte", [90, 10, 15], "#F5D2B4"),
    ("15 Cappuccino", [85, 15, 20], "#F0C8A0"),
    ("17 Raf", [80, 20, 25], "#EBBE96"),
    ("20 Gal\u00e3o", [75, 25, 30], "#E1B48C"),
    ("25 Macchiato", [70, 30, 35], "#D7AA82"),
    ("27 Vienna", [65, 35, 40], "#CD9F78"),
    ("30 Chococcino", [60, 40, 45], "#C3966E"),
    ("32 Cortado", [55, 45, 50], "#B98C64"),
    ("35 Frappe", [50, 50, 55], "#AF825A"),
    ("37 Freddo", [45, 55, 60], "#A57A50"),
    ("40 Breve", [40, 60, 65], "#9B6E46"),
    ("42 Glace", [35, 65, 70], "#91643C"),
    ("45 Con Panna", [30, 70, 75], "#875A32"),
    ("48 Irish", [25, 75, 80], "#7D5028"),
    ("52 Corretto", [20, 80, 85], "#73461E"),
    ("55 Americano", [15, 85, 90], "#693C14"),
    ("57 Borgia", [10, 90, 95], "#5F320A"),
    ("60 Tiramisu", [5, 95, 100], "#552800"),
    ("65 Espresso", [0, 105, 110], "#401400")
]

for name, lab, hex_val in sugar_af_shades:
    shades_database.append({
        "brand": "SUGAR Cosmetics",
        "product": "Ace Of Face Foundation Stick",
        "shade": name,
        "name": f"Ace Of Face - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 1149,
        "date_added": "2026-07-14",
        "finish": "Waterproof Matte",
        "coverage": "Full"
    })


# --- COLORBAR ---
# 24Hrs Weightless Liquid Foundation (Price: 1499)
cb_wl_shades = [
    ("FW 1.1", [72.78, 11.93, 18.21], "#d4aa92"),
    ("FW 1.2", [74.38, 10.67, 21.03], "#d8af91"),
    ("FW 1.3", [67.22, 12.12, 19.09], "#c59b82"),
    ("FW 1.4", [68.75, 13.43, 22.41], "#cd9e80"),
    ("FW 2.1", [74.9, 17.0, 23.56], "#E5AC8E"),
    ("FC 2.2", [74.9, 17.0, 23.56], "#E5AC8E"),
    ("FW 2.3", [74.21, 18.28, 28.05], "#E7A984"),
    ("FC 3.2", [68.16, 17.74, 32.12], "#D6996D"),
    ("FW 3.3", [76.01, 16.59, 28.9], "#EAAF87"),
    ("FC 4.1", [68.59, 12.67, 23.81], "#CC9E7D"),
    ("FC 4.2", [64.37, 14.23, 20.66], "#C19278"),
    ("FW 4.3", [57.55, 16.15, 21.25], "#B17F66"),
    ("FW 4.4", [59.02, 14.46, 19.87], "#B2846C"),
    ("FW 5.1", [62.68, 16.27, 24.5], "#C18C6D"),
    ("FC 6.3", [59.04, 14.58, 19.33], "#B2846D"),
    ("FW 7.2", [58.33, 13.08, 22.26], "#AF8366"),
    ("FW 8.1", [53.93, 15.44, 27.04], "#A87653"),
    ("FW 8.3", [48.35, 19.98, 24.75], "#9E654A"),
    ("FC 7.1", [46.12, 16.66, 20.97], "#92624B"),
    ("FC 3.1", [90.23, 5.3, 9.6], "#F5DFD1"),
    ("FW 5.2", [84.81, 5.14, 7.98], "#E4D0C5")
]

for name, lab, hex_val in cb_wl_shades:
    undertone = "Warm" if "FW" in name else "Cool"
    shades_database.append({
        "brand": "Colorbar",
        "product": "24Hrs Weightless Liquid Foundation",
        "shade": name,
        "name": f"24Hrs Weightless - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 1499,
        "date_added": "2026-07-14",
        "finish": "Airbrush Matte",
        "coverage": "Medium to Full",
        "undertone": undertone
    })

# Stick Foundation (Price: 639)
cb_st_shades = [
    ("Fresh Ivory", [84.81, 5.14, 7.98], "#E4D0C5"),
    ("Au Natural", [77.49, 17.16, 21.83], "#ECB398")
]

for name, lab, hex_val in cb_st_shades:
    shades_database.append({
        "brand": "Colorbar",
        "product": "Stick Foundation",
        "shade": name,
        "name": f"Stick Foundation - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 639,
        "date_added": "2026-07-14",
        "finish": "Natural Creamy",
        "coverage": "Medium"
    })

# BB Cream Foundation (Price: 520)
cb_bb_shades = [
    ("Vanilla Creme", [69.55, 14.38, 32.29], "#D59F70"),
    ("Honey Glaze", [69.23, 11.25, 37.08], "#D1A066"),
    ("White Light", [86.03, 4.25, 23.55], "#F0D3AB")
]

for name, lab, hex_val in cb_bb_shades:
    shades_database.append({
        "brand": "Colorbar",
        "product": "BB Cream Foundation",
        "shade": name,
        "name": f"BB Cream - {name}",
        "lab": lab,
        "hex": hex_val,
        "price": 520,
        "date_added": "2026-07-14",
        "finish": "Dewy Glow",
        "coverage": "Light"
    })


# --- VERIFY AND WRITE ---

# Save foundation_db.json
json_path = os.path.join("src", "foundation_db.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(shades_database, f, indent=2, ensure_ascii=False)

print(f"Successfully generated {json_path} with {len(shades_database)} shades.")

# Generate src/db_shades.ts
ts_content = f"""export interface ShadeData {{
  brand: string;
  name: string;
  product?: string;
  shade?: string;
  lab: [number, number, number];
  hex?: string;
  price: number;
  date_added: string;
  spf?: number;
  coverage?: string;
  finish?: string;
  undertone?: string;
  skin_type?: string;
}}

export const shadesDatabase: ShadeData[] = {json.dumps(shades_database, indent=2, ensure_ascii=False)};
"""

ts_path = os.path.join("src", "db_shades.ts")
with open(ts_path, "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"Successfully generated {ts_path} with {len(shades_database)} shades.")
