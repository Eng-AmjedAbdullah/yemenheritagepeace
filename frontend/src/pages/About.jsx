import { useLang } from '../App'
import PageHeader from '../components/PageHeader'
import {
  Eye,
  Target,
  HeartHandshake,
  FlaskConical,
  ShieldCheck,
  Users,
} from 'lucide-react'

export default function About() {
  const { t, lang } = useLang()
  const isRtl = lang === 'ar'

  const aboutText = isRtl
    ? 'منظمة تراث اليمن لأجل السلام هي منظمة مجتمع مدني غير ربحية تأسست وفقًا لقانون الجمعيات والمؤسسات الأهلية اليمني رقم (1) لسنة 2001م ولائحته التنفيذية. يقع مقرها الرئيسي في محافظة تعز، الجمهورية اليمنية. تأسست المنظمة عام 2025م، وصرح لها رسميًا في يناير 2026م بموجب التصريح رقم 11م/2026م. يتركز نشاطها في مجالات الثقافة والعلوم والتنمية البيئية والسياحية.'
    : 'Yemen Heritage for Peace Organization is a non-profit civil society organization established in accordance with Yemen’s Law No. (1) of 2001 concerning associations and civil institutions and its executive regulations. Headquartered in Taiz Governorate, Republic of Yemen, the organization was founded in 2025 and officially licensed in January 2026 under Permit No. 11M/2026. Its work focuses on culture, science, environmental development, and tourism development.'

  const aboutSecondText = isRtl
    ? 'تسعى المنظمة إلى صون التراث اليمني وتعزيز الوعي الثقافي والعلمي، ودعم المبادرات التي تربط الهوية الحضارية بالتنمية المستدامة والسلام المجتمعي.'
    : 'The organization seeks to preserve Yemeni heritage, promote cultural and scientific awareness, and support initiatives that connect civilizational identity with sustainable development and community peace.'

  const values = isRtl
    ? [
        { Icon: HeartHandshake, label: 'السلام', desc: 'نعمل من أجل مجتمع يمني يسوده السلام والتعاون.' },
        { Icon: FlaskConical, label: 'الابتكار العلمي', desc: 'توظيف العلم والتكنولوجيا لخدمة التراث والإنسان.' },
        { Icon: ShieldCheck, label: 'الشفافية والاستدامة', desc: 'الالتزام بالحوكمة الرشيدة والمساءلة واستدامة الأثر.' },
        { Icon: Users, label: 'المشاركة المجتمعية', desc: 'إشراك المجتمع المحلي في صون الهوية والتراث.' },
      ]
    : [
        { Icon: HeartHandshake, label: 'Peace', desc: 'Working towards a society of peace and cooperation.' },
        { Icon: FlaskConical, label: 'Scientific Innovation', desc: 'Using science and technology to serve heritage and people.' },
        { Icon: ShieldCheck, label: 'Transparency & Sustainability', desc: 'Good governance, accountability, and sustainable impact.' },
        { Icon: Users, label: 'Community Participation', desc: 'Engaging local communities in preserving identity and heritage.' },
      ]

  const goals = isRtl
    ? t.goals_list
    : [
        'Contributing to educational development and building a sustainable research system that promotes peace and international cooperation.',
        'Protecting, preserving, and reviving cultural heritage and promoting Yemeni intellectual property rights.',
        'Contributing to environmental preservation and protecting it from pollution and climate impacts.',
        'Supporting sustainable tourism development with economic and social benefits while ensuring equality.',
        'Working alongside local and international partners to achieve Sustainable Development Goals.',
      ]

  return (
    <main>
      <PageHeader
        title={t.nav.about}
        subtitle={aboutText}
      />

      {/* WHO WE ARE */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h2 className="section-title mb-5 text-start">
              {isRtl ? 'من نحن' : 'Who We Are'}
            </h2>

            <p className="text-gray-600 leading-relaxed mb-4 text-base">
              {aboutText}
            </p>

            <p className="text-gray-600 leading-relaxed text-base">
              {aboutSecondText}
            </p>
          </div>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
              <Eye size={22} className="text-primary" />
            </div>
            <h3 className="text-xl font-bold text-dark mb-3">{t.vision}</h3>
            <p className="text-gray-600 leading-relaxed text-sm">{t.vision_text}</p>
          </div>

          <div className="bg-primary rounded-2xl p-6 text-white shadow-lg">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
              <Target size={22} className="text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t.mission}</h3>
            <p className="text-white/90 leading-relaxed text-sm">{t.mission_text}</p>
          </div>
        </div>
      </section>

      {/* GOALS */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="section-title mb-8">{t.goals}</h2>

          <div className="space-y-3 text-start">
            {goals.map((goal, i) => (
              <div
                key={i}
                className="flex gap-3 items-start bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/20 rounded-xl p-5 transition-all duration-200"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm shadow-primary/20">
                  {i + 1}
                </div>
                <p className="text-gray-600 leading-relaxed text-sm">{goal}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="section-title mb-8">{t.values}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <v.Icon size={20} className="text-primary" />
                </div>
                <div className="font-bold mb-2 text-dark">{v.label}</div>
                <div className="text-gray-500 text-sm leading-relaxed">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
