import { useEffect, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map as GoogleMapView,
} from '@vis.gl/react-google-maps';
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { applySeoMetadata } from '../utils/seo';

const SHOWROOM_COORDS = { lat: 48.1389, lng: 11.5396 };

export function ContactPage() {
  const { settings, publicConfig, submitEnquiry, pushToast } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Modellberatung & Probefahrt');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [infoOpen, setInfoOpen] = useState(true);

  useEffect(() => {
    applySeoMetadata({
      title: `Kontakt & Showroom München | ${settings.brandName}`,
      description:
        'Persönliche E-Bike Beratung, Probefahrt-Anfragen und Kundenservice in Deutschland. Standortkarte, Öffnungszeiten und Kontaktformular.',
      canonicalPath: '/kontakt',
      siteName: settings.brandName,
    });
  }, [settings.brandName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const res = await submitEnquiry({
      type: 'contact',
      name,
      email,
      phone,
      subject,
      message,
    });
    setSending(false);
    if (res.ok) {
      setSentOk(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      pushToast(res.message, 'success');
    } else {
      pushToast(res.message, 'error');
    }
  };

  return (
    <main className="bg-[#F4F6F8] min-h-[75vh] py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1677FF]">
            Kundenservice & Muster-Showroom
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold text-[#171C22]">
            Kontakt & Fachberatung
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Fragen zur Rahmengröße, Akku-Reichweite, S-Pedelec-Zulassung oder zu Ihrer Bestellung? Schreiben Sie uns direkt.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold text-[#171C22]">
              Nachricht senden
            </h2>
            {sentOk ? (
              <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-sm text-emerald-900">
                <p className="font-semibold">Vielen Dank für Ihre Anfrage!</p>
                <p className="mt-1">
                  Ihre Nachricht wurde im System gespeichert und über die konfigurierte E-Mail-Schnittstelle protokolliert.
                </p>
                <button
                  type="button"
                  onClick={() => setSentOk(false)}
                  className="mt-4 text-xs font-semibold underline"
                >
                  Weitere Nachricht schreiben
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Ihr Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      E-Mail-Adresse *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Telefon (optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Thema
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white"
                    >
                      <option value="Modellberatung & Probefahrt">Modellberatung & Probefahrt</option>
                      <option value="Bestellstatus & Speditionsversand">Bestellstatus & Speditionsversand</option>
                      <option value="Werkstatt, Service & Garantie">Werkstatt, Service & Garantie</option>
                      <option value="B2B & Dienstrad-Anfrage">B2B & Dienstrad-Anfrage</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Ihre Nachricht *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Wie können wir Ihnen weiterhelfen?"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#171C22] text-white text-sm font-semibold rounded-md hover:bg-[#1677FF] disabled:bg-slate-300 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Wird übermittelt...' : 'Anfrage absenden'}
                </button>
              </form>
            )}
          </div>

          {/* Showroom Details + Interactive Google Map */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-sm">
              <h2 className="font-display text-lg font-bold text-[#171C22]">
                Kontaktdaten & Showroom
              </h2>
              <div className="flex items-start gap-3 text-slate-700">
                <MapPin className="w-4 h-4 text-[#1677FF] mt-1 shrink-0" />
                <div>
                  <p className="font-semibold text-[#171C22]">{settings.brandName}</p>
                  <p>{settings.streetAddress}</p>
                  <p>
                    {settings.postalCode} {settings.city}, Deutschland
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <Phone className="w-4 h-4 text-[#1677FF] shrink-0" />
                <span>{settings.contactPhone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <Mail className="w-4 h-4 text-[#1677FF] shrink-0" />
                <span>{settings.contactEmail}</span>
              </div>
              <div className="flex items-start gap-3 text-slate-700">
                <Clock className="w-4 h-4 text-[#1677FF] mt-1 shrink-0" />
                <span>{settings.businessHours}</span>
              </div>

              {settings.whatsappNumber && (
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Beratung starten
                </a>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Standortkarte ({settings.city})
                </span>
                <span className="text-[11px] text-slate-500">Google Maps Platform</span>
              </div>
              <div className="w-full h-[320px] bg-slate-100 relative">
                {publicConfig.mapsApiKey ? (
                  <APIProvider apiKey={publicConfig.mapsApiKey} language="de" region="DE">
                    <GoogleMapView
                      mapId="DEMO_MAP_ID"
                      defaultCenter={SHOWROOM_COORDS}
                      defaultZoom={14}
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <AdvancedMarker
                        position={SHOWROOM_COORDS}
                        onClick={() => setInfoOpen((o) => !o)}
                      />
                      {infoOpen && (
                        <InfoWindow
                          position={SHOWROOM_COORDS}
                          onCloseClick={() => setInfoOpen(false)}
                        >
                          <div className="text-xs text-[#171C22] max-w-[200px] p-1">
                            <p className="font-bold">{settings.brandName}</p>
                            <p className="mt-0.5 text-slate-600">{settings.streetAddress}</p>
                            <p className="text-slate-600">
                              {settings.postalCode} {settings.city}
                            </p>
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMapView>
                  </APIProvider>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-600">
                    <MapPin className="w-8 h-8 text-[#1677FF] mb-2" />
                    <p className="text-sm font-semibold text-[#171C22]">
                      {settings.brandName} Showroom
                    </p>
                    <p className="text-xs mt-1">
                      {settings.streetAddress}, {settings.postalCode} {settings.city}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Interaktive Karte wird geladen, sobald ein Google Maps API-Key konfiguriert ist.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
