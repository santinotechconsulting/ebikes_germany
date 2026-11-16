import { useEffect } from 'react';
import { Award, Leaf, ShieldCheck, Wrench } from 'lucide-react';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { IMG_WORKSHOP } from '../data/seedData';
import { applySeoMetadata } from '../utils/seo';

export function AboutPage() {
  const { settings, navigate } = useStore();

  useEffect(() => {
    applySeoMetadata({
      title: `Über uns – ${settings.brandName}`,
      description:
        'Erfahren Sie mehr über Qualitätsansprüche, Vormontage nach deutschen Standards und nachhaltige Elektromobilität.',
      canonicalPath: '/ueber-uns',
      ogImage: IMG_WORKSHOP,
      siteName: settings.brandName,
    });
  }, [settings.brandName]);

  return (
    <main className="bg-white">
      <section className="bg-[#171C22] text-white py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1677FF]">
              Über {settings.brandName}
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold leading-tight">
              {settings.aboutTitle}
            </h1>
            <p className="mt-5 text-base text-slate-300 leading-relaxed whitespace-pre-line">
              {settings.aboutStory}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="px-5 py-3 bg-[#1677FF] text-white text-sm font-semibold rounded-md hover:bg-[#1262d4] transition-colors"
              >
                E-Bike Kollektion entdecken
              </button>
              <button
                type="button"
                onClick={() => navigate('/kontakt')}
                className="px-5 py-3 border border-slate-600 text-white text-sm font-semibold rounded-md hover:border-white transition-colors"
              >
                Beratung vereinbaren
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="aspect-[16/10] rounded-xl overflow-hidden border border-slate-800">
              <SafeImage
                src={IMG_WORKSHOP}
                alt="Moderne E-Bike Meisterwerkstatt in Deutschland"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 bg-[#F4F6F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#171C22]">
            Unsere Leitprinzipien im Demo-Konzept
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Wrench,
                title: 'Fahrfertige Endkontrolle',
                desc: 'Jedes E-Bike wird vor dem Speditionsversand anhand einer klaren Checkliste auf Bremsdruck, Schaltung und Drehmoment geprüft.',
              },
              {
                icon: ShieldCheck,
                title: 'Transparenz & Konformität',
                desc: 'Klare Trennung zwischen 25 km/h Pedelecs (EN 15194) und 45 km/h S-Pedelecs (L1e-B) inklusive verständlicher Sicherheitshinweise.',
              },
              {
                icon: Leaf,
                title: 'Klimafreundliche Mobilität',
                desc: 'Vom täglichen Pendeln bis zum Lastenrad-Einsatz fördern wir leise und effiziente Alternativen zum innerstädtischen PKW-Verkehr.',
              },
              {
                icon: Award,
                title: 'Konfigurierbare Stammdaten',
                desc: 'Alle Marken, Modelle, Rechtstexte und Kontaktdaten lassen sich unmittelbar im integrierten Admin-Bereich an reale Unternehmensdaten anpassen.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-6">
                <item.icon className="w-6 h-6 text-[#1677FF]" />
                <h3 className="mt-4 font-display font-bold text-lg text-[#171C22]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
