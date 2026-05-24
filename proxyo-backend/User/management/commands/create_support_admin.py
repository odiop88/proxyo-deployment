from django.core.management.base import BaseCommand
from User.models.support_model import SupportAdmin


class Command(BaseCommand):
    help = "Crée un compte SupportAdmin si aucun n'existe déjà."

    def add_arguments(self, parser):
        parser.add_argument('--email',      default='support@proxyo.com')
        parser.add_argument('--password',   default='Admin1234!')
        parser.add_argument('--first_name', default='Support')
        parser.add_argument('--last_name',  default='Admin')
        parser.add_argument('--force', action='store_true',
                            help='Recrée le compte même s\'il existe déjà.')

    def handle(self, *args, **options):
        email = options['email']

        if SupportAdmin.objects.filter(email=email).exists():
            if not options['force']:
                self.stdout.write(self.style.WARNING(
                    f"Un SupportAdmin avec l'email '{email}' existe déjà. "
                    "Utilisez --force pour le recréer."
                ))
                return
            SupportAdmin.objects.filter(email=email).delete()

        admin = SupportAdmin(
            first_name=options['first_name'],
            last_name=options['last_name'],
            email=email,
        )
        admin.set_password(options['password'])
        admin.save()

        self.stdout.write(self.style.SUCCESS(
            f"SupportAdmin créé : {admin.email}"
        ))
