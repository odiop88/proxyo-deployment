from django.apps import AppConfig


class UserConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'User'

    def ready(self):
        from django.db.models.signals import post_migrate
        post_migrate.connect(_create_default_support_admin, sender=self)


def _create_default_support_admin(**kwargs):
    try:
        from User.models.support_model import SupportAdmin
        if not SupportAdmin.objects.exists():
            admin = SupportAdmin(
                first_name='Support',
                last_name='Admin',
                email='support@proxyo.com',
            )
            admin.set_password('Admin1234!')
            admin.save()
            print("SupportAdmin par défaut créé : support@proxyo.com / Admin1234!")
    except Exception:
        pass
