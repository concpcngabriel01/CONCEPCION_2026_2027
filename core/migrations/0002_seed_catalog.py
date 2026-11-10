from django.db import migrations


PRODUCTS = [
    (
        "p1001",
        "Everyday Canvas Tote",
        "A sturdy canvas tote for daily errands.",
        "NTH-TOT-001",
        "24.00",
        "Accessories",
        40,
    ),
    (
        "p1002",
        "Insulated Travel Mug",
        "Double-wall stainless steel travel mug.",
        "NTH-HOM-002",
        "18.50",
        "Home",
        32,
    ),
    (
        "p1003",
        "Classic Crew T-Shirt",
        "Soft cotton crew-neck shirt.",
        "NTH-CLT-003",
        "29.00",
        "Clothing",
        25,
    ),
    (
        "p1004",
        "Minimal Desk Lamp",
        "Compact adjustable lamp with a warm LED bulb.",
        "NTH-HOM-004",
        "46.00",
        "Home",
        14,
    ),
    (
        "p1005",
        "Everyday Backpack",
        "Lightweight backpack with a padded laptop sleeve.",
        "NTH-TOT-005",
        "62.00",
        "Accessories",
        18,
    ),
    (
        "p1006",
        "Ceramic Plant Pot",
        "A glazed ceramic pot for small indoor plants.",
        "NTH-HOM-006",
        "21.00",
        "Home",
        20,
    ),
]


def seed_products(apps, schema_editor):
    Product = apps.get_model("core", "Product")
    Product.objects.using(schema_editor.connection.alias).bulk_create(
        [
            Product(
                id=product_id,
                name=name,
                description=description,
                sku=sku,
                price=price,
                category=category,
                stock=stock,
            )
            for product_id, name, description, sku, price, category, stock in PRODUCTS
        ]
    )


def remove_seeded_products(apps, schema_editor):
    Product = apps.get_model("core", "Product")
    Product.objects.using(schema_editor.connection.alias).filter(
        id__in=[product[0] for product in PRODUCTS]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]

    operations = [migrations.RunPython(seed_products, remove_seeded_products)]
