from django.db import migrations


SKU_RENAMES = {
    "NTH-TOT-001": "LSP-TOT-001",
    "NTH-HOM-002": "LSP-HOM-002",
    "NTH-CLT-003": "LSP-CLT-003",
    "NTH-HOM-004": "LSP-HOM-004",
    "NTH-TOT-005": "LSP-TOT-005",
    "NTH-HOM-006": "LSP-HOM-006",
}


def rename_skus(apps, schema_editor):
    Product = apps.get_model("core", "Product")
    database = schema_editor.connection.alias
    for old_sku, new_sku in SKU_RENAMES.items():
        Product.objects.using(database).filter(sku=old_sku).update(sku=new_sku)


def restore_skus(apps, schema_editor):
    Product = apps.get_model("core", "Product")
    database = schema_editor.connection.alias
    for old_sku, new_sku in SKU_RENAMES.items():
        Product.objects.using(database).filter(sku=new_sku).update(sku=old_sku)


class Migration(migrations.Migration):
    dependencies = [("core", "0002_seed_catalog")]

    operations = [migrations.RunPython(rename_skus, restore_skus)]
