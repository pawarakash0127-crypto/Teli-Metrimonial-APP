import { db, collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query, where, orderBy, getDoc } from '../lib/firebase';

export interface NewsItem {
  id: string;
  category: string;
  title: string;
  titleEn: string;
  date: string;
  location: string;
  image: string;
  summary: string;
  fullText: string;
  sourceName: string;
  sourceUrl: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_COMMUNITY_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    category: 'वधू-वर परिचय मेळावा',
    title: 'नाशिक जिल्हा तेली समाज भव्य राज्यस्तरीय वधू-वर परिचय मेळावा २०२६',
    titleEn: 'Nashik District Teli Samaj State-Level Matrimonial Meet 2026',
    date: '15 ऑगस्ट 2026',
    location: 'रावसाहेब थोरात सभागृह, गंगापूर रोड, नाशिक',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
    summary: 'नाशिक जिल्हा तेली समाज संचलित वधू-वर सूचक केंद्रातर्फे भव्य राज्यस्तरीय परिचय मेळावा आयोजित करण्यात आला आहे. डिजिटल माहिती पुस्तिकेचे प्रकाशन व ऑनलाईन नावनोंदणी सुविधा उपलब्ध.',
    fullText: 'नाशिक जिल्हा संचलित तेली समाज वधू-वर सूचक केंद्राच्या वतीने आगामी १५ ऑगस्ट २०२६ रोजी गंगापूर रोड येथील रावसाहेब थोरात सभागृहात राज्यस्तरीय भव्य वधू-वर परिचय मेळाव्याचे आयोजन करण्यात आले आहे. या मेळाव्यात उच्चशिक्षित, डॉक्टर, इंजिनिअर, शासकीय अधिकारी व व्यावसायिकांसाठी विशेष सत्र आयोजित केले जाईल. सोबतच सर्व नोंदणीकृत उमेदवारांची रंगीत माहिती पुस्तिका (E-Booklet) प्रसिद्ध केली जाणार आहे.',
    sourceName: 'सकाळ नाशिक (Sakal)',
    sourceUrl: 'https://www.sakal.com/nashik',
    published: true,
    createdAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'news-2',
    category: 'गुणवत्ता सत्कार व जयंती',
    title: 'संत संताजी जगनाडे महाराज स्मृती उत्सव व ५१ व्या गुणवंत विद्यार्थी सत्कार',
    titleEn: 'Santaji Jagnade Maharaj Jayanti & Student Excellence Awards',
    date: '28 जुलै 2026',
    location: 'संताजी भवन, पंचवटी, नाशिक',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
    summary: 'नाशिक शहरातील तेली समाज युवक संघटनेतर्फे १० वी व १२ वी मध्ये उत्कृष्ट यश मिळवणाऱ्या १५० हून अधिक गुणवंत विद्यार्थ्यांचा मानपत्र व शैक्षणिक संच देऊन गौरव करण्यात आला.',
    fullText: 'तेली समाज युवक संघटना नाशिक तर्फे संत संताजी जगनाडे महाराज जयंती निमित्त पंचवटी येथील संताजी भवनात भव्य शैक्षणिक गुणगौरव समारंभ पार पडला. याप्रसंगी नाशिक जिल्ह्यातील इयत्ता १० वी, १२ वी व पदवी परीक्षेत प्राविण्य मिळवणाऱ्या १५० हून अधिक विद्यार्थ्यांना स्मृतिचिन्ह, मानपत्र व मोफत शैक्षणिक किट वाटप करण्यात आले. समाजातील ज्येष्ठांचाही यावेळी विशेष नागरी सत्कार करण्यात आला.',
    sourceName: 'लोकमत नाशिक (Lokmat)',
    sourceUrl: 'https://www.lokmat.com/nashik/',
    published: true,
    createdAt: '2026-07-28T10:00:00.000Z'
  },
  {
    id: 'news-3',
    category: 'व्यवसाय व उद्योग',
    title: 'तेली समाज उद्योगपती व व्यावसायिक नेटवर्क समिट - नाशिक २०२६',
    titleEn: 'Nashik Teli Samaj Entrepreneurs & Business Network Summit',
    date: '12 जून 2026',
    location: 'हॉटेल एक्सप्रेस इन, मुंबई-आग्रा हायवे, नाशिक',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800',
    summary: 'तेली समाजातील नवउद्योजकांना शासकीय कर्ज योजना, स्टार्टअप मार्गदर्शन व बिझनेस नेटवर्किंगसाठी नाशिकमध्ये भव्य व्यापारी परिषद यशस्वीरीत्या संपन्न.',
    fullText: 'नाशिक तेली समाज बिझनेस फोरमच्या पुढाकाराने आयोजित व्यापारी परिषदेत १०० पेक्षा जास्त समाजबांधव उद्योजक एकत्र आले. नवीन उद्योग सुरू करू इच्छिणाऱ्या तरुणांसाठी मुद्रा कर्ज योजना, एमएसएमई सबसिडी व आंतरराष्ट्रीय व्यापाराच्या संधी याविषयी तज्ज्ञांचे मार्गदर्शन लाभले. समाजबांधवांमध्ये परस्पर व्यापार व व्यवसाय वृद्धीसाठी बिझनेस डिरेक्टरी लॉन्च करण्यात आली.',
    sourceName: 'देशदूत नाशिक (Deshdoot)',
    sourceUrl: 'https://deshdoot.com/',
    published: true,
    createdAt: '2026-06-12T10:00:00.000Z'
  },
  {
    id: 'news-4',
    category: 'महिला सशक्तीकरण',
    title: 'तेली समाज महिला मंडळ नाशिक: डिजिटल साक्षरता व गृहउद्योग कार्यशाळा',
    titleEn: 'Teli Samaj Mahila Mandal Digital Literacy & Self-Employment Workshop',
    date: '02 मे 2026',
    location: 'तिळक वाडी, नाशिक',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800',
    summary: 'महिला भगिनींसाठी ऑनलाईन व्यवहार, गृहउद्योग मार्केटिंग व आरोग्य मार्गदर्शन शिबिराचे आयोजन. मोठ्या संख्येने महिलांची उपस्थिती.',
    fullText: 'नाशिक तेली समाज महिला मंडळाच्या वतीने टिळक वाडी येथे एकदिवसीय महिला सशक्तीकरण कार्यशाळा पार पडला. यामध्ये महिलांना ऑनलाईन बँकिंग सुरक्षितता, सोशल मीडिया मार्केटिंग, बचत गट व्यवस्थापन आणि आरोग्य तपासणीबाबत मार्गदर्शन करण्यात आले. समाजातील महिलांना स्वावलंबी बनवण्यासाठी विविध गृहउद्योगांचे मोफत प्रशिक्षण देण्याचा संकल्प जाहीर करण्यात आला.',
    sourceName: 'महाराष्ट्र टाइम्स (MTimes)',
    sourceUrl: 'https://www.mtimes.in/nashik',
    published: true,
    createdAt: '2026-05-02T10:00:00.000Z'
  },
  {
    id: 'news-5',
    category: 'समाज प्रबोधन व उपक्रम',
    title: 'नाशिक शहर तेली समाज: आरोग्य तपासणी व भव्य रक्तदान शिबीर उपक्रम',
    titleEn: 'Nashik City Teli Samaj Free Health Checkup & Blood Donation Drive',
    date: '18 एप्रिल 2026',
    location: 'तेली समाज मंगल कार्यालय, सिडको, नाशिक',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
    summary: 'सिडको नाशिक येथे आयोजित मोफत नेत्ररोग, दंतरोग व मधुमेह तपासणी शिबिरात ५०० हून अधिक समाजबांधवांनी लाभ घेतला. सोबतच १०१ बाटल्या रक्तदान गोळा.',
    fullText: 'नाशिक शहर तेली समाजाच्या रौप्य महोत्सवी वर्षानिमित्त सिडको येथील मंगल कार्यालयात भव्य मोफत आरोग्य शिबीर व रक्तदान उपक्रम आयोजित करण्यात आला. शहरातील प्रसिद्ध निष्णात तज्ज्ञ डॉक्टरांच्या टीमने ५०० पेक्षा जास्त नागरिकांची तपासणी केली व मोफत औषध वाटप केले.',
    sourceName: 'पुढारी न्यूज (Pudhari)',
    sourceUrl: 'https://pudhari.news/',
    published: true,
    createdAt: '2026-04-18T10:00:00.000Z'
  }
];

export const COMMUNITY_NEWS = INITIAL_COMMUNITY_NEWS;

/**
 * Seeds initial community news to Firestore if collection is empty.
 */
export async function seedInitialCommunityNews(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'community_news'));
    if (snap.empty) {
      for (const item of INITIAL_COMMUNITY_NEWS) {
        await setDoc(doc(db, 'community_news', item.id), item);
      }
    }
  } catch (err) {
    console.error("Error seeding initial community news:", err);
  }
}

/**
 * Subscribes to published community news in real-time.
 * Only returns articles with published == true. If none exist, returns empty array.
 */
export function subscribePublishedCommunityNews(callback: (news: NewsItem[]) => void): () => void {
  const q = query(collection(db, 'community_news'), where('published', '==', true));
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const items: NewsItem[] = [];
    snapshot.forEach((d) => {
      items.push({ ...(d.data() as NewsItem), id: d.id });
    });
    items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(items);
  }, (err) => {
    console.warn("Error subscribing to community news:", err);
    callback([]);
  });
}

/**
 * Subscribes to ALL community news (for admin dashboard).
 */
export function subscribeAllCommunityNews(callback: (news: NewsItem[]) => void): () => void {
  const q = collection(db, 'community_news');
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const items: NewsItem[] = [];
    snapshot.forEach((d) => {
      items.push({ ...(d.data() as NewsItem), id: d.id });
    });
    items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    callback(items);
  }, (err) => {
    console.warn("Error subscribing to all community news for admin:", err);
    callback([]);
  });
}

/**
 * Saves (creates or updates) a community news item.
 */
export async function saveCommunityNewsItem(item: Partial<NewsItem> & { id?: string }): Promise<string> {
  const id = item.id || `news-${Date.now()}`;
  const newsDocRef = doc(db, 'community_news', id);
  const existing = await getDoc(newsDocRef);
  
  const payload: NewsItem = {
    id,
    category: item.category || 'समाज उपक्रम',
    title: item.title || '',
    titleEn: item.titleEn || '',
    date: item.date || new Date().toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    location: item.location || 'नाशिक',
    image: item.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
    summary: item.summary || '',
    fullText: item.fullText || '',
    sourceName: item.sourceName || 'नाशिक तेली समाज',
    sourceUrl: item.sourceUrl || '',
    published: item.published !== false,
    createdAt: existing.exists() ? (existing.data().createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(newsDocRef, payload, { merge: true });
  return id;
}

/**
 * Deletes a community news item by ID.
 */
export async function deleteCommunityNewsItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'community_news', id));
}
