import { useLang } from '../App'
import PageHeader from '../components/PageHeader'
import {
  Building2,
  Eye,
  Gem,
  HeartHandshake,
  FlaskConical,
  ShieldCheck,
  Users,
  Landmark,
  Network,
  Leaf,
  BookOpen,
  Compass,
  Mail,
  Target,
} from 'lucide-react'

const ACCENT = '#18a2be'

export default function About() {
  const { t, lang } = useLang()
  const isRtl = lang === 'ar'

  const headerSubtitle = isRtl
    ? 'نعمل من أجل صون التراث اليمني وربطه بالمعرفة والتنمية والسلام المجتمعي.'
    : 'Preserving Yemeni heritage while connecting identity with knowledge, development, and community peace.'

  const whoIntro = isRtl
    ? 'منظمة تراث اليمن لأجل السلام هي منظمة مجتمع مدني غير ربحية، مقرها الرئيسي في محافظة تعز، الجمهورية اليمنية. تأسست وفقًا لقانون الجمعيات والمؤسسات الأهلية اليمني رقم (1) لسنة 2001م ولائحته التنفيذية.'
    : 'Yemen Heritage for Peace Organization is a non-profit civil society organization headquartered in Taiz Governorate, Republic of Yemen. It was established in accordance with Yemen’s Law No. (1) of 2001 concerning associations and civil institutions and its executive regulations.'

  const whoFocus = isRtl
    ? 'تعمل المنظمة في مجالات الثقافة والعلوم والتنمية البيئية والسياحية، وتسعى إلى تحويل التراث اليمني إلى مساحة معرفة وسلام وتنمية تشارك فيها المؤسسات والمجتمعات المحلية.'
    : 'The organization works in culture, science, environmental development, and tourism development, seeking to turn Yemeni heritage into a space for knowledge, peace, and development shared by institutions and local communities.'

  const organizationFacts = isRtl
    ? [
        {
          Icon: Landmark,
          title: 'الإطار القانوني',
          text: 'تأسست المنظمة عام 2025م، وصرح لها رسميًا في يناير 2026م بموجب التصريح رقم 11م/2026م.',
        },
        {
          Icon: Building2,
          title: 'الهيكل المؤسسي',
          text: 'يشرف على أعمال المنظمة رئيس المنظمة ورئيس مجلس الأمناء، إلى جانب مجلس أمناء، ومجلس استشاري أكاديمي، ومجلس تنفيذي، ومراجع مالي خارجي، وفريق إداري مؤهل.',
        },
        {
          Icon: Network,
          title: 'العلاقات والشراكات',
          text: 'ترتبط المنظمة بعلاقات وتفاهمات مع السلطة المحلية، والجامعات، والمراكز البحثية، والهيئة العامة للآثار والمتاحف، ومنظمات المجتمع المدني، والاتحادات الحرفية والإبداعية.',
        },
      ]
    : [
        {
          Icon: Landmark,
          title: 'Legal Framework',
          text: 'The organization was founded in 2025 and officially licensed in January 2026 under Permit No. 11M/2026.',
        },
        {
          Icon: Building2,
          title: 'Institutional Structure',
          text: 'Its work is overseen by the organization president and board chair, supported by a board of trustees, an academic advisory council, an executive council, an external auditor, and a qualified administrative team.',
        },
        {
          Icon: Network,
          title: 'Relations & Partnerships',
          text: 'The organization maintains cooperation with local authorities, universities, research centers, the General Authority for Antiquities and Museums, civil society organizations, and creative and craft associations.',
        },
      ]

  const vision = isRtl
    ? 'أن يكون التراث اليمني مصدرًا حيًا للوعي والسلام والتنمية، وأن تصبح الهوية الحضارية اليمنية قوة فاعلة في بناء مجتمع أكثر معرفة وتعاونًا واستدامة.'
    : 'To make Yemeni heritage a living source of awareness, peace, and development, and to turn Yemen’s civilizational identity into an active force for a more knowledgeable, cooperative, and sustainable society.'

  const mission = isRtl
    ? 'صون التراث اليمني المادي وغير المادي، وتعزيز البحث والمعرفة، وتمكين المجتمع من المشاركة في حماية الهوية الثقافية، من خلال برامج تعليمية وبيئية وسياحية وشراكات محلية ودولية.'
    : 'To preserve Yemen’s tangible and intangible heritage, promote research and knowledge, and empower communities to protect cultural identity through educational, environmental, tourism-related programs and local and international partnerships.'

  const goals = isRtl
    ? [
        'الإسهام في تطوير التعليم وبناء بيئة بحثية مستدامة تعزز السلام والتعاون.',
        'حماية التراث الثقافي اليمني وصونه وإحياؤه والتعريف بحقوق الملكية الفكرية المرتبطة به.',
        'دعم جهود حماية البيئة والحد من آثار التلوث والتغيرات المناخية.',
        'تشجيع التنمية السياحية المستدامة بما يحقق أثرًا اقتصاديًا واجتماعيًا عادلًا.',
        'تعزيز الشراكات مع الجهات المحلية والدولية لخدمة أهداف التنمية المستدامة.',
      ]
    : [
        'Contribute to educational development and support a sustainable research environment that promotes peace and cooperation.',
        'Protect, preserve, and revive Yemeni cultural heritage while raising awareness of related intellectual property rights.',
        'Support environmental protection and reduce the impacts of pollution and climate change.',
        'Encourage sustainable tourism development with fair economic and social benefits.',
        'Strengthen partnerships with local and international actors to serve the Sustainable Development Goals.',
      ]

  const values = isRtl
    ? [
        {
          Icon: Compass,
          label: 'الهوية',
          desc: 'نؤمن بأن التراث ذاكرة حية تعزز الانتماء وتمنح الأجيال صلة راسخة بجذورها.',
        },
        {
          Icon: HeartHandshake,
          label: 'السلام',
          desc: 'نجعل الثقافة مساحة للتقارب والحوار والعمل المشترك بين الناس.',
        },
        {
          Icon: BookOpen,
          label: 'المعرفة',
          desc: 'نستند إلى البحث والخبرة الأكاديمية في فهم التراث وتوثيقه ونشره.',
        },
        {
          Icon: FlaskConical,
          label: 'الابتكار',
          desc: 'نوظف العلم والتقنيات الحديثة لخدمة التراث والتنمية المجتمعية.',
        },
        {
          Icon: ShieldCheck,
          label: 'الشفافية',
          desc: 'نلتزم بالحوكمة الرشيدة والمساءلة والعمل المؤسسي الواضح.',
        },
        {
          Icon: Leaf,
          label: 'الاستدامة',
          desc: 'نصمم مبادرات تراعي الإنسان والبيئة واستمرار الأثر.',
        },
      ]
    : [
        {
          Icon: Compass,
          label: 'Identity',
          desc: 'We see heritage as a living memory that strengthens belonging and connects generations to their roots.',
        },
        {
          Icon: HeartHandshake,
          label: 'Peace',
          desc: 'We use culture as a space for dialogue, cooperation, and shared community action.',
        },
        {
          Icon: BookOpen,
          label: 'Knowledge',
          desc: 'We rely on research and academic expertise to understand, document, and share heritage.',
        },
        {
          Icon: FlaskConical,
          label: 'Innovation',
          desc: 'We use science and modern tools to serve heritage and community development.',
        },
        {
          Icon: ShieldCheck,
          label: 'Transparency',
          desc: 'We are committed to good governance, accountability, and clear institutional work.',
        },
        {
          Icon: Leaf,
          label: 'Sustainability',
          desc: 'We design initiatives that respect people, the environment, and long-term impact.',
        },
      ]

  return (
    <main dir={isRtl ? 'rtl' : 'ltr'} className="overflow-hidden">
      <PageHeader title={t.nav.about} subtitle={headerSubtitle} />

      {/* WHO WE ARE */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-2xl font-black text-dark md:text-3xl">
            {isRtl ? 'من نحن' : 'Who We Are'}
          </h2>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm sm:p-8">
            <div className="space-y-4 text-base leading-relaxed text-gray-600">
              <p>{whoIntro}</p>
              <p>{whoFocus}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {organizationFacts.map((item, index) => (
              <InfoCard
                key={index}
                Icon={item.Icon}
                title={item.title}
                text={item.text}
              />
            ))}
          </div>
        </div>
      </section>

      {/* VISION / MISSION / GOALS */}
      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="space-y-5">
            <InfoPanel
              Icon={Eye}
              title={isRtl ? 'الرؤية' : 'Vision'}
            >
              <p>{vision}</p>
            </InfoPanel>

            <InfoPanel
              Icon={Mail}
              title={isRtl ? 'الرسالة' : 'Mission'}
            >
              <p>{mission}</p>
            </InfoPanel>

            <InfoPanel
              Icon={Target}
              title={isRtl ? 'الأهداف' : 'Goals'}
            >
              <div className="space-y-3">
                {goals.map((goal, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 transition hover:border-primary/20 hover:bg-primary/5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-sm shadow-primary/20">
                      {index + 1}
                    </div>

                    <p className="text-sm leading-7 text-gray-600">
                      {goal}
                    </p>
                  </div>
                ))}
              </div>
            </InfoPanel>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            icon={Gem}
            title={isRtl ? 'القيم' : 'Values'}
            center
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <value.Icon size={22} className="text-primary" />
                </div>

                <h3
                  className="mb-2 text-lg font-bold"
                  style={{ color: ACCENT }}
                >
                  {value.label}
                </h3>

                <p className="text-sm leading-7 text-gray-500">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function SectionHeading({ icon: Icon, title, center = false }) {
  return (
    <div
      className={`mb-8 flex items-center gap-3 ${
        center ? 'justify-center text-center' : 'justify-start'
      }`}
    >
      <IconBox>
        <Icon size={22} className="text-primary" />
      </IconBox>

      <h2
        className="text-2xl font-black md:text-3xl"
        style={{ color: ACCENT }}
      >
        {title}
      </h2>
    </div>
  )
}

function InfoCard({ Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      <IconBox className="mb-4">
        <Icon size={21} className="text-primary" />
      </IconBox>

      <h3
        className="mb-2 text-lg font-bold"
        style={{ color: ACCENT }}
      >
        {title}
      </h3>

      <p className="text-sm leading-7 text-gray-500">
        {text}
      </p>
    </div>
  )
}

function InfoPanel({ Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <IconBox>
          <Icon size={22} className="text-primary" />
        </IconBox>

        <h3
          className="text-xl font-bold md:text-2xl"
          style={{ color: ACCENT }}
        >
          {title}
        </h3>
      </div>

      <div className="text-sm leading-7 text-gray-600 sm:text-base">
        {children}
      </div>
    </div>
  )
}

function IconBox({ children, className = '' }) {
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ${className}`}
    >
      {children}
    </div>
  )
}
