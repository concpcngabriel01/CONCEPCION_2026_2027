from django.db import migrations


IMAGE_URLS = {
    "KIT": "https://images.pexels.com/photos/6969831/pexels-photo-6969831.jpeg?auto=compress&cs=tinysrgb&w=800",
    "LIV": "https://images.pexels.com/photos/4108710/pexels-photo-4108710.jpeg?auto=compress&cs=tinysrgb&w=800",
    "BED": "https://images.pexels.com/photos/6585759/pexels-photo-6585759.jpeg?auto=compress&cs=tinysrgb&w=800",
    "BTH": "https://images.pexels.com/photos/6585756/pexels-photo-6585756.jpeg?auto=compress&cs=tinysrgb&w=800",
    "CLN": "https://images.pexels.com/photos/3738089/pexels-photo-3738089.jpeg?auto=compress&cs=tinysrgb&w=800",
    "APP": "https://images.pexels.com/photos/6969831/pexels-photo-6969831.jpeg?auto=compress&cs=tinysrgb&w=800",
    "DIN": "https://images.pexels.com/photos/4099354/pexels-photo-4099354.jpeg?auto=compress&cs=tinysrgb&w=800",
    "DEC": "https://images.pexels.com/photos/4108710/pexels-photo-4108710.jpeg?auto=compress&cs=tinysrgb&w=800",
    "LAU": "https://images.pexels.com/photos/3738089/pexels-photo-3738089.jpeg?auto=compress&cs=tinysrgb&w=800",
}

CATALOG = [
    ("KIT", "Kitchen Essentials", [
        ("Cooking Pot", 1299), ("Frying Pan", 899), ("Rice Cooker", 1899),
        ("Electric Kettle", 799), ("Blender", 1499), ("Knife Set", 1099),
        ("Chopping Board", 349), ("Spatula Set", 299), ("Ladle", 179),
        ("Plates and Bowls", 699), ("Drinking Glasses", 399),
        ("Food Storage Containers", 549), ("Dish Rack", 599),
        ("Measuring Cups", 249), ("Kitchen Organizer", 499),
    ]),
    ("LIV", "Living Room (Sala)", [
        ("Sofa", 24999), ("Recliner Chair", 14999), ("Coffee Table", 4999),
        ("TV Stand", 6999), ("Bookshelf", 3999), ("Side Table", 2299),
        ("Throw Pillows", 599), ("Area Rug", 2999), ("Curtains", 1299),
        ("Floor Lamp", 2499), ("Wall Clock", 899), ("Decorative Vase", 799),
        ("Wall Frames", 999), ("Shoe Rack", 1799),
    ]),
    ("BED", "Bedroom Essentials", [
        ("Bed Frame", 12999), ("Mattress", 9999), ("Pillow", 599),
        ("Blanket", 899), ("Comforter", 1899), ("Bedsheets", 1299),
        ("Wardrobe", 14999), ("Clothes Hanger", 199), ("Bedside Table", 2499),
        ("Dressing Table", 6999), ("Laundry Basket", 699),
        ("Bedside Lamp", 1299), ("Storage Cabinet", 4999),
    ]),
    ("BTH", "Bathroom Essentials", [
        ("Shower Curtain", 499), ("Bath Towels", 699), ("Bath Mat", 399),
        ("Soap Dispenser", 249), ("Toothbrush Holder", 199),
        ("Shower Caddy", 449), ("Toilet Brush", 229), ("Trash Bin", 499),
        ("Bathroom Mirror", 1499), ("Tissue Holder", 299),
        ("Laundry Hamper", 999),
    ]),
    ("CLN", "Cleaning Supplies", [
        ("Broom", 249), ("Dustpan", 149), ("Mop", 499), ("Bucket", 299),
        ("Vacuum Cleaner", 4999), ("Floor Cleaner", 189),
        ("Glass Cleaner", 159), ("Cleaning Brushes", 249),
        ("Microfiber Cloth", 129), ("Scrub Sponge", 79),
        ("Garbage Bags", 99), ("Spray Bottles", 119), ("Duster", 199),
    ]),
    ("APP", "Home Appliances", [
        ("Refrigerator", 24999), ("Washing Machine", 17999),
        ("Electric Fan", 1999), ("Air Conditioner", 22999),
        ("Microwave Oven", 4999), ("Rice Cooker", 1599), ("Toaster", 999),
        ("Blender", 1399), ("Electric Kettle", 699),
        ("Water Dispenser", 5999), ("Clothes Iron", 899), ("Hair Dryer", 799),
    ]),
    ("DIN", "Dining Room Essentials", [
        ("Dining Table", 12999), ("Dining Chairs", 2999),
        ("Dinnerware Set", 1999), ("Fork and Spoon Set", 499),
        ("Serving Tray", 399), ("Table Runner", 499), ("Placemat", 199),
        ("Water Pitcher", 349), ("Food Serving Bowls", 599),
        ("Dining Cabinet", 9999),
    ]),
    ("DEC", "Home Decorations", [
        ("Artificial Plants", 499), ("Flower Vases", 599), ("Wall Art", 1299),
        ("Photo Frames", 399), ("Decorative Mirrors", 1999),
        ("Scented Candles", 349), ("LED Lights", 599), ("Table Lamps", 1499),
        ("Wall Shelves", 999), ("Decorative Clocks", 899),
        ("Figurines", 499), ("Door Mats", 349),
    ]),
    ("LAU", "Laundry Essentials", [
        ("Laundry Basket", 699), ("Clothes Drying Rack", 1499),
        ("Clothes Hanger", 199), ("Laundry Detergent", 299),
        ("Fabric Conditioner", 249), ("Ironing Board", 1999),
        ("Clothespins", 99), ("Laundry Bag", 249), ("Storage Bins", 499),
    ]),
]

ROOMS = {
    "KIT": "kitchen",
    "LIV": "living room",
    "BED": "bedroom",
    "BTH": "bathroom",
    "CLN": "home",
    "APP": "home",
    "DIN": "dining room",
    "DEC": "home",
    "LAU": "laundry room",
}

HOUSEHOLD_IDS = [
    f"house-{code.lower()}-{index:03d}"
    for code, _, items in CATALOG
    for index, _ in enumerate(items, start=1)
]


def seed_household_catalog(apps, schema_editor):
    Product = apps.get_model("core", "Product")
    database = schema_editor.connection.alias
    Product.objects.using(database).filter(id__in=[
        "p1001", "p1002", "p1003", "p1004", "p1005", "p1006",
    ]).update(is_active=False)

    products = []
    for code, category, items in CATALOG:
        for index, (name, price) in enumerate(items, start=1):
            image_url = IMAGE_URLS[code]
            products.append(Product(
                id=f"house-{code.lower()}-{index:03d}",
                name=name,
                description=(
                    f"A dependable {name.lower()} selected for everyday use "
                    f"and lasting comfort in your {ROOMS[code]}."
                ),
                sku=f"LSP-{code}-{index:03d}",
                price=f"{price}.00",
                category=category,
                stock=8 + ((index * 7 + ord(code[0])) % 43),
                thumbnail=image_url,
                image_url=image_url,
                is_active=True,
            ))
    Product.objects.using(database).bulk_create(products, ignore_conflicts=True)


def retire_household_catalog(apps, schema_editor):
    Product = apps.get_model("core", "Product")
    database = schema_editor.connection.alias
    Product.objects.using(database).filter(id__in=HOUSEHOLD_IDS).update(is_active=False)
    Product.objects.using(database).filter(id__in=[
        "p1001", "p1002", "p1003", "p1004", "p1005", "p1006",
    ]).update(is_active=True)


class Migration(migrations.Migration):
    dependencies = [("core", "0003_living_space_skus")]

    operations = [
        migrations.RunPython(seed_household_catalog, retire_household_catalog),
    ]
