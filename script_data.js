/*****************************************************************
 * 2. DOSYA (script_data.js):
 * - TÜM OKUMA METİNLERİ .JS İÇİNDEN SİLİNMİŞTİR; SADECE metinler.db
 *   VERİTABANINDAN OKUNUR VE ORAYA KAYDEDİLİR.
 * - Egzersiz kelime havuzları (Takistoskop, Anlam, Kelime Açılımı,
 *   Genişleyen Kare/Yuvarlak, Çapraz Köşe) ve site_metinleri.json
 *   yöneticisi bu dosyada yer alır.
 *****************************************************************/

const LOCAL_DB_FILENAME = 'metinler.db';
let localDbFileHandle = null;

/*****************************************************************
 * 1. GÖMÜLÜ SİTE METİNLERİ (site_metinleri.json İLE TAM UYUMLU)
 *****************************************************************/
const EMBEDDED_SITE_METINLERI = {
  "egitim_videolari": [
    {
      "order": 1,
      "title": "1. Ders: Blok Okuma — Beynimiz Kelimeleri Nasıl Fotoğraflar?",
      "id": "fGHJg8VV4EY",
      "url": "https://www.youtube.com/shorts/fGHJg8VV4EY"
    },
    {
      "order": 2,
      "title": "2. Ders: Hızlı Okuma Gözleri Bozar Mı? Göz Kasları Nasıl Çalışır?",
      "id": "7aOnk-FtPKk",
      "url": "https://www.youtube.com/shorts/7aOnk-FtPKk"
    },
    {
      "order": 3,
      "title": "3. Ders: İç Seslendirme (Subvokalizasyon) Nasıl Kapatılır?",
      "id": "678o4Ztyc6Y",
      "url": "https://www.youtube.com/shorts/678o4Ztyc6Y"
    },
    {
      "order": 4,
      "title": "4. Ders: Hızlı Okumanın Sırrı — Vurgulu Blok Okuma Tekniği",
      "id": "cUYCypIJARA",
      "url": "https://www.youtube.com/shorts/cUYCypIJARA"
    },
    {
      "order": 5,
      "title": "5. Ders: Hızlı Okumamızı Engelleyen Dört Gizli Hata",
      "id": "ZwwRyicp0z4",
      "url": "https://www.youtube.com/shorts/ZwwRyicp0z4"
    },
    {
      "order": 6,
      "title": "6. Ders: Dijital Göz Egzersizleri Basılı Kitapları Nasıl Hızlandırır?",
      "id": "TqqQLNwJZ-Y",
      "url": "https://www.youtube.com/shorts/TqqQLNwJZ-Y"
    },
    {
      "order": 7,
      "title": "7. Ders: Takistoskop ve Hızlı Okumanın Bilimsel Tarihi",
      "id": "ddvRPFv5VMA",
      "url": "https://www.youtube.com/shorts/ddvRPFv5VMA"
    },
    {
      "order": 8,
      "title": "8. Ders: Hızlı Okumak Anlama Oranını Düşürür mü?",
      "id": "3aMlM0Aeoig",
      "url": "https://www.youtube.com/shorts/3aMlM0Aeoig"
    },
    {
      "order": 9,
      "title": "9. Ders: Bilgiyi Hafızaya Kazıyan Etkin Okuma ve Kondisyon Sistemi",
      "id": "4Kv5aP_NBZ8",
      "url": "https://www.youtube.com/shorts/4Kv5aP_NBZ8"
    }
  ],
  "sikca_sorulan_sorular": [
    {
      "question": "2X Hızlı Okuma Eğitimi okuma hızımı ne kadar sürede ve hangi oranda artırır?",
      "answer": "Günde ortalama 15–20 dakikalık düzenli okülomotor göz antrenmanları ve blok okuma çalışmalarıyla ilk 2 haftadan itibaren okuma hızınızda belirgin bir ivme başlar; 30 aşamalı program tamamlandığında başlangıç hızınıza göre 2 ila 4 kat (2X–4X) arasında kalıcı artış sağlanır."
    },
    {
      "question": "Okuma hızım arttığında metni anlama ve hatırlama oranım düşer mi?",
      "answer": "Hayır, aksine yükselir. Çok yavaş ve kelime kelime okuduğunuzda zihin boşluklarda farklı düşüncelere kayar ve cümlenin başı unutulur. İkili ve üçlü kelime bloklarıyla ritmik okuma yapıldığında ise beyin metni bütünsel bir tablo gibi algılar ve odaklanma oranı %85'in üzerine çıkar."
    },
    {
      "question": "Bu eğitim hangi yaş grupları ve sınav öğrencileri için uygundur?",
      "answer": "İlkokul (4. sınıftan itibaren), ortaokul (LGS), lise (YKS/TYT/AYT), üniversite (KPSS, ALES, DGS) öğrencileri ile yoğun iş temposunda kitap, makale ve raporları çok daha kısa sürede okumak isteyen tüm yetişkinler için özel kademelerle yapılandırılmıştır."
    },
    {
      "question": "Sınavlarda (LGS, YKS, KPSS, ALES) uzun paragraf sorularında nasıl bir avantaj sağlar?",
      "answer": "Uzun paragraf sorularını tekrar tekrar baştan okuma alışkanlığını (regresyon) ortadan kaldırır. Soru kökünü ve metnin ana fikrini tek bakışta yakalamanızı sağlayarak sınav genelinde 15 ila 25 dakika arasında fazladan süre kazanmanıza yardımcı olur."
    },
    {
      "question": "Günlük ne kadar vakit ayırmalıyım, yoğun tempoda eğitime devam edebilir miyim?",
      "answer": "Sistem mikro-antrenman mantığıyla tasarlanmıştır. Her bir göz ve blok okuma egzersizi 25–30 saniye sürer; günde yalnızca 15 dakikalık odaklanmış bir çalışma bir aşamayı tamamlamanız için yeterlidir."
    },
    {
      "question": "Dijital ekranda yapılan göz egzersizleri basılı kitap okuma hızımı da geliştirir mi?",
      "answer": "Evet. Antrenmanlar doğrudan göz küresini hareket ettiren 6 temel okülomotor kası ve beynin görsel algı merkezini eğittiği için, kazanılan çevresel görme genişliği basılı kitaplarda ve sınav kitapçıklarında da birebir aynı etkiyi gösterir."
    },
    {
      "question": "Hızlı okuma çalışmaları gözleri yorar mı veya göz sağlığına zarar verir mi?",
      "answer": "Göz egzersizleri göz kaslarına esneklik ve kondisyon kazandıran doğal hareketlerdir, göze zarar vermez. Ayrıca sistem içerisinde yer alan 'Palming' (göz dinlendirme) molaları sayesinde gözleriniz dinlendirilerek ekran yorgunluğunun önüne geçilir."
    },
    {
      "question": "Eğitim bittikten sonra okuma hızım kalıcı olur mu, eski yavaş hızıma geri döner miyim?",
      "answer": "30 aşamalı süreç boyunca beyinde yeni görsel okuma refleksleri oluşur ve bu beceri kalıcı hale gelir. Ayrıca eğitim sonunda açılan 'Var Olanı Koruma Modu' ile haftada birkaç dakikalık ısınma pratikleri yaparak ulaştığınız en yüksek hızı ömür boyu koruyabilirsiniz."
    },
    {
      "question": "Dikkat dağınıklığı ve okurken satır karıştırma sorunu yaşayanlar için faydalı mıdır?",
      "answer": "Kesinlikle. Satır Başı-Sonu Sekme, Schulte Tablosu ve Takistoskop egzersizleri doğrudan seçici dikkati ve görsel odaklanmayı güçlendirir; satır atlama ve kelimelere takılma sorunlarını en aza indirir."
    },
    {
      "question": "30 aşamalı sistemde hızları kendim mi seçiyorum yoksa sistem mi belirliyor?",
      "answer": "Aşama eğitimlerinde WPM ve BPM hızları bilimsel gelişim eğrisine göre kademeli olarak artar ve her sınıfın sonunda Sınıf Tamamlama Testi ile bir üst sınıfa geçilir. Bunun yanında 'Manuel Mod' sekmesinden tüm hız ve blok ayarlarını dilediğiniz zaman kendiniz de belirleyebilirsiniz."
    },
    {
      "question": "Başarı Sertifikası ne zaman verilir ve nasıl indirilir?",
      "answer": "Sistemde Çok Yavaş kademesinden Çok Hızlı / İleri Seviye kademesine kadar 5 ayrı hız sınıflandırması yer alır. İlk sınıfı ve tamamlama testini geçtiğinizde sertifikanız açılır; üst sınıfları bitirdikçe sertifikanız güncellenir ve isminize özel PDF olarak indirilebilir."
    },
    {
      "question": "Uygulamayı telefon, tablet ve bilgisayardan aynı anda kullanabilir miyim?",
      "answer": "Evet. Üye hesabınızla giriş yaptığınızda tüm aşama ilerlemeleriniz, hız istatistikleriniz ve görünüm tercihleriniz bulut veritabanında senkronize edilir; istediğiniz cihazdan kaldığınız yerden devam edebilirsiniz."
    }
  ],
  "yasal_metinler": {
    "kvkk": {
      "title": "📜 6698 Sayılı KVKK Kapsamında Aydınlatma Metni",
      "html": "<h4>1. Veri Sorumlusu</h4><p>6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla <strong>Serhat Nehir — 2X Hızlı Okuma Eğitimi</strong> tarafından aşağıda açıklanan kapsamda işlenmektedir.</p><h4>2. İşlenen Kişisel Veriler ve İşleme Amaçları</h4><p>Ad, soyad, e-posta adresi, doğum tarihi, şehir ve eğitim ilerleme verileriniz; öğrenci hesabınızın oluşturulması, 30 aşamalı antrenman gelişiminizin kaydedilmesi ve Başarı Sertifikanızın düzenlenmesi amacıyla işlenmektedir.</p><h4>3. Kişisel Verilerin Aktarılması ve Güvenliği</h4><p>Kişisel verileriniz yasal zorunluluklar haricinde üçüncü kişilerle paylaşılmamakta, güvenli bulut veritabanı altyapısında şifreli (SHA-256 özetleme) olarak muhafaza edilmektedir.</p><h4>4. İlgili Kişinin Hakları</h4><p>KVKK’nın 11. maddesi kapsamında kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme haklarına sahipsiniz.</p>"
    },
    "terms": {
      "title": "⚖️ Kullanım ve Hizmet Koşulları Sözleşmesi",
      "html": "<h4>1. Taraflar ve Konu</h4><p>İşbu Kullanım ve Hizmet Koşulları, <strong>2X Hızlı Okuma Eğitimi</strong> dijital platformunu kullanan tüm öğrenci ve ziyaretçilerin kullanım şartlarını belirler.</p><h4>2. Lisans ve Fikri Mülkiyet Hakları</h4><p>Uygulamadaki tüm yazılım kodları, 14 interaktif göz egzersizi, metinler ve tasarımlar <strong>Serhat Nehir</strong> telif hakları kapsamında korunmaktadır. İzinsiz kopyalanamaz, çoğaltılamaz ve dağıtılamaz.</p><h4>3. Hesap Güvenliği ve Kullanım</h4><p>Kullanıcı hesapları kişiye özeldir. Kullanıcı, kayıt sırasında verdiği bilgilerin doğruluğundan ve hesap şifresinin güvenliğinden sorumludur.</p>"
    },
    "privacy": {
      "title": "🔒 Gizlilik ve Kişisel Verileri Koruma Politikası",
      "html": "<h4>1. Gizlilik Taahhüdü</h4><p><strong>2X Hızlı Okuma Eğitimi</strong> olarak kullanıcılarımızın gizliliğine en üst düzeyde önem veriyoruz. E-posta adresiniz ve profil bilgileriniz yalnızca eğitim hizmetinin sunulması amacıyla kullanılır.</p><h4>2. Çerezler ve Yerel Depolama</h4><p>Oturumunuzun açık kalması, görünüm ayarlarınız (tema, ekran genişliği, Palming süresi) ve aşama ilerlemelerinizin kaybolmaması için tarayıcı yerel depolama (LocalStorage / IndexedDB) teknolojileri kullanılmaktadır.</p><h4>3. Veri Güvenliği</h4><p>Kullanıcı şifreleri tek yönlü kriptografik özetleme (SHA-256) ile korunmakta olup düz metin olarak saklanmaz.</p>"
    },
    "sales": {
      "title": "💳 Mesafeli Satış Sözleşmesi ve İptal / İade Koşulları",
      "html": "<h4>1. Sözleşmenin Konusu</h4><p>İşbu sözleşmenin konusu, Alıcı'nın <strong>2X Hızlı Okuma Eğitimi</strong> dijital eğitim paketini (1.900,00 ₺ KDV Dahil) elektronik ortamda satın alması ve kullanımına ilişkin hak ve yükümlülüklerin belirlenmesidir.</p><h4>2. Teslimat ve Aktivasyon</h4><p>Dijital eğitim paketi, kredi/banka kartı veya Havale/EFT/FAST ödemesinin tamamlanmasının ardından öğrenci hesabı üzerinden erişime açılır.</p><h4>3. Dijital İçerik ve Cayma Hakkı</h4><p>Mesafeli Sözleşmeler Yönetmeliği uyarınca elektronik ortamda anında ifa edilen dijital eğitim içeriklerinde ilgili mevzuat hükümleri uygulanır.</p>"
    }
  }
};

/*****************************************************************
 * 2. EGZERSİZ KELİME HAVUZLARI
 *****************************************************************/
const EMBEDDED_EXERCISE_POOLS = {
  "anlam_antrenmani": `
elma, armut, muz | 1
masa, sandalye, dolap | 1
bilgisayar, sandal, aslan | 0
kalem, defter, silgi | 1
doktor, hemşire, hastane | 1
bulut, çatal, kaplan | 0
güneş, ay, yıldız | 1
gitar, keman, piyano | 1
bardak, uçak, karınca | 0
otobüs, tren, uçak | 1
papatya, gül, lale | 1
klavye, domates, çekiç | 0
kış, ilkbahar, yaz | 1
futbol, basketbol, voleybol | 1
pencere, balina, gözlük | 0
portakal, çilek, kavun | 1
yatak, zambak, basketbol | 0
öğretmen, okul, öğrenci | 1
patates, kulaklık, fırtına | 0
gitar, davul, piyano | 1
sandalye, komodin, kitaplık | 1
karate, şeftali, metro | 0
yağmur, dolu, kar | 1
ayran, limonata, kahve | 1
aslan, nilüfer, tencere | 0
pantolon, ceket, gömlek | 1
çorap, meteor, dolap | 0
yüzme, tenis, atletizm | 1
kurt, ayı, tilki | 1
pergel, cetvel, makas | 1
tava, bulut, keman | 0
hüzün, öfke, sevinç | 1
şapka, kazak, kaban | 1
vapur, helikopter, taksi | 1
taksi, şalgam, dolunay | 0
ıspanak, pırasa, lahana | 1
kuyrukluyıldız, gezegen, ay | 1
mart, nisan, mayıs | 1
doktor, yargıç, dondurma | 0
klavye, monitör, yazıcı | 1
çatal, bıçak, kaşık | 1
fare, patlıcan, şimşek | 0
karanfil, orkide, nergis | 1
heyecan, endişe, korku | 1
çay, su, ayran | 1
biber, salatalık, havuç | 1
voleybol, eldiven, kiraz | 0
trompet, saksafon, flüt | 1
kartal, şahin, baykuş | 1
şubat, ocak, haziran | 1
yargıç, avukat, adliye | 1
tabak, kepçe, rende | 1
silgi, dolunay, otobüs | 0
dolap, sehpa, koltuk | 1
tablet, telefon, kulaklık | 1
şalgam, boza, salep | 1
erik, şeftali, mandalina | 1
zürafa, fil, aslan | 1
nilüfer, menekşe, gül | 1
mutluluk, sevinç, umut | 1
komodin, berjer, yatak | 1
fırtına, rüzgar, sis | 1
futbol, judo, boks | 1
makas, kalemtıraş, dosya | 1
karpuz, tren, papatya | 0
kimya, biyoloji, fizik | 1
fırın, nehir, tebeşir | 0
marangoz, terzi, berber | 1
sözlük, ansiklopedi, atlas | 1
kartal, buzdolabı, ceket | 0
nehir, göl, şelale | 1
üçgen, kare, daire | 1
mikroskop, dürbün, teleskop | 1
pantolon, atom, vapur | 0
altın, gümüş, bakır | 1
çam, meşe, kavak | 1
helikopter, domates, piyano | 0
çorba, pilav, güveç | 1
fırın, ocak, davlumbaz | 1
avukat, galaksi, karpuz | 0
tiyatro, sinema, opera | 1
şapka, eldiven, atkı | 1
köpekbalığı, ahtapot, yunus | 1
merdiven, şimşek, patlıcan | 0
matematik, geometri, cebir | 1
deprem, sel, çığ | 1
tavşan, sincap, kunduz | 1
gözlük, nehir, şeftali | 0
yastık, yorgan, battaniye | 1
tabak, bardak, kase | 1
balta, testere, keski | 1
gezegen, terzi, makarna | 0
şömine, soba, kalorifer | 1
zeytin, peynir, reçel | 1
minder, pergel, leopar | 0
otoyol, köprü, tünel | 1
kalkan, kılıç, mızrak | 1
heykel, tablo, fresk | 1
fırtına, sandalye, bal | 0
bavul, çanta, cüzdan | 1
kale, şato, saray | 1
çekiç, tornavida, pense | 1
kelebek, traktör, çorap | 0
çaydanlık, cezve, fincan | 1
kayak, paten, kızak | 1
mikrofon, kulaklık, hoparlör | 1
kaplan, cetvel, şelale | 0
trampet, zil, tef | 1
limon, portakal, greyfurt | 1
sarmaşık, kaktüs, eğreltiotu | 1
yıldız, buğday, merdiven | 0
kayısı, şeftali, nektarin | 1
badem, fındık, ceviz | 1
fıskiye, havuz, bent | 1
teleskop, ceket, patates | 0
göz, kulak, burun | 1
fırtına, cüzdan, papatya | 0
yönetmen, senarist, yapımcı | 1
hırka, yelek, süveter | 1
teleskop, tencere, kedi | 0
vadi, kanyon, ova | 1
akrep, yelkovan, kadran | 1
şampanya, şarap, bira | 1
dolap, buğday, helikopter | 0
akciğer, karaciğer, böbrek | 1
felsefe, sosyoloji, psikoloji | 1
balta, karpuz, keman | 0
keman, viyola, kontrbas | 1
kavun, karpuz, kabak | 1
mimar, şömine, balina | 0
tepsi, sürahi, bardak | 1
arpa, buğday, çavdar | 1
traktör, biçerdöver, mibzer | 1
merdiven, aslan, şapka | 0
mercimek, nohut, fasulye | 1
çorap, eldiven, atkı | 1
bavul, teleskop, peynir | 0
kartal, şahin, doğan | 1
gazete, dergi, bülten | 1
patates, roket, gömlek | 0
fırtına, hortum, kasırga | 1
kiremit, tuğla, çimento | 1
doktor, orkide, pergel | 0
kuzey, güney, doğu | 1
pirinç, bulgur, kuskus | 1
tebeşir, vapur, kaplan | 0
ırmak, dere, çay | 1
uçak, planör, zeplin | 1
kalem, dondurma, köprü | 0
yüzük, kolye, küpe | 1
karyola, baza, şilte | 1
patlıcan, uydu, tilki | 0
teras, balkon, veranda | 1
gitar, tambur, ud | 1
makas, gezegen, yoğurt | 0
resim, heykel, seramik | 1
baston, şemsiye, yelpaze | 1
tavşan, klavye, şelale | 0
ceket, yelek, pantolon | 1
çekiç, kerpeten, mengene | 1
hastane, defter, fıskiye | 0
koyun, keçi, inek | 1
kalkan, zırh, miğfer | 1
ceviz, fındık, leblebi | 1
radyo, soğan, merdiven | 0
`,

  "capraz_kose": `
odaklanma
hızlı algı
çevik bakış
görsel hafıza
tam konsantrasyon
aktif zihin
bütünsel okuma
net görüş
ritmik sıçrama
güçlü bellek
esnek kaslar
yüksek verim
`,

  "genisleyen_kare": `
odak, hız, algı, zihin
kitap, bilgi, beyin, görüş
ritim, sıçra, hedef, başarı
optik, merkez, bellek, anlam
kavram, bütün, vizyon, dikkat
analiz, sentez, okuma, gelişim
hafıza, refleks, netlik, seviye
sistem, teknik, pratik, sonuç
kelime, cümle, paragraf, metin
gözlem, kavrama, düşünce, mantık
`,

  "genisleyen_yuvarlak": `
merkez, çevre, bakış, geniş
akıcı, bütünsel, görsel, korteks
sıçrama, tarama, hızlanma, odaklanma
kondisyon, esneklik, çeviklik, denge
anlama, hatırlama, kodlama, çağrışım
disiplin, istikrar, antrenman, zirve
potansiyel, kapasite, verim, enerji
okülomotor, periferik, fotoğrafik, zihinsel
`,

  "kelime_acilimi": `
odak, hız
zihin, görüş
kitap, bilgi
beyin, algı
ritim, sıçra
hedef, başarı
optik, merkez
bellek, anlam
kavram, bütün
vizyon, dikkat
analiz, sentez
okuma, gelişim
radyo, soğan
hastane, defter
tavşan, klavye
makas, gezegen
patlıcan, uydu
kalem, dondurma
tebeşir, vapur
doktor, orkide
patates, roket
bavul, teleskop
merdiven, aslan
mimar, şömine
balta, karpuz
dolap, buğday
teleskop, tencere
fırtına, cüzdan
kedi, keman
gazete, bardak
börek, felsefe
ırmak, doktor
gitar, makas
ceket, küpe
çimento, peynir
ceviz, merdiven
klavye, tabur
teras, patlıcan
`,

  "takistoskop_1": `
kitap
zihin
odak
bilgi
algı
ritim
hedef
beyin
hızlı
görüş
bellek
okuma
hız
sıçra
başarı
optik
merkez
anlam
kavram
bütün
vizyon
dikkat
analiz
sentez
gelişim
radyo
soğan
hastane
defter
tavşan
klavye
makas
gezegen
patlıcan
uydu
kalem
dondurma
tebeşir
vapur
doktor
orkide
patates
roket
bavul
teleskop
merdiven
aslan
mimar
şömine
balta
karpuz
dolap
buğday
tencere
fırtına
cüzdan
kedi
keman
gazete
bardak
börek
felsefe
ırmak
gitar
ceket
küpe
çimento
peynir
ceviz
tabur
teras
`,

  "takistoskop_2": `
hızlı okuma
aktif görüş
göz kasları
derin odak
güçlü hafıza
esnek bakış
net algılama
zihin akışı
hızlı kavrama
görsel hafıza
aktif tarama
odaklanma gücü
zihinsel çeviklik
periferik görüş
algı açıklığı
içsel sessizlik
blok okuma
bilgi işleme
satır takibi
kelime haritası
fotografik bellek
nöral esneklik
dikkat kontrolü
seri tarama
analitik zihin
yüksek uyanıklık
metin bütünlüğü
anlam örgüsü
sezgisel okuma
görsel genişlik
düşünce hızı
bilişsel denge
refleks bakış
kavramsal derinlik
zihinsel berraklık
metin akışı
odak derinliği
bellek kaydı
anlık idrak
çevresel farkındalık
göz koordinasyonu
akıcı düşünce
bilişsel kontrol
anlamlandırma sürati
kelime kümesi
optik ritim
dikkat süresi
zihin dinginliği
hızlı eşleme
sembol tanıma
dinamik görme
kavrayış derinliği
ritmik atlama
veri süzgeci
konsantrasyon alanı
zihinsel esneklik
aktif algı
blok kavrama
optik odak
mantıksal süzgeç
zihin netliği
hafıza izi
kesintisiz dikkat
akıcı kavrayış
görüş açısı
görsel sıçrama
bilgi özümseme
içsel rehberlik
zihinsel tazelik
aktif izleme
göz ritmi
bilişsel derinlik
yüksek konsantrasyon
hızlı çözümleme
anlam yakalama
görsel algılama
bellek gücü
zihinsel ivme
seri kavrayış
duru algı
geniş ufuk
odak merkezi
göz sıçraması
aktif konsantrasyon
düşünce akışı
hızlı indeksleme
bütünsel bakış
kavram süzgeci
metin çözme
zihinsel canlanma
görsel netlik
bellek tazeleme
algı eşiği
akıcı analiz
nöronal bağlantı
iç ses kontrolü
satır atlama
ritmik bakış
seri düşünme
görsel zekâ
`,

  "takistoskop_3": `
çevresel görme alanı
bütünsel metin algısı
yüksek odaklanma hızı
kesintisiz göz sıçraması
kalıcı hafıza tekniği
hızlı görsel kavrayış
bütüncül metin taraması
etkin odaklanma kapasitesi
geniş çevresel algı
akıcı satır takibi
derin bilişsel süreç
esnek düşünce akışı
dinamik bellek aktarımı
ritmik göz hareketi
hızlı kelime bloklama
aktif metin mimarisi
fotoğrafik bellek kaydı
keskin algı eşiği
iç ses bastırma
seri anlama hızı
bilişsel netlik düzeyi
görsel genişleme alanı
optik odaklama gücü
zamansal algı kontrolü
anlamsal örgü çözümleme
derinlemesine kavrayış yetisi
zihinsel refleks hızı
blok okuma tekniği
satır sonu sıçraması
yüksek dikkat kararlılığı
bilgi süzme mekanizması
sezgisel metin tahlili
optik izleme kabiliyeti
akıl yürütme esnekliği
çevresel uyaran filtreleme
aktif hatırlama süreci
uzamsal bellek kapasitesi
zihinsel enerji yönetimi
görsel tarama disiplini
anlık idrak gücü
odak derinliği kontrolü
nörolojik işlem hızı
bütünleşik algılama yeteneği
düşünce netliği sağlama
ritmik okuma temposu
bellek pekiştirme egzersizi
seri sembol analizi
çevresel görüş açısı
akıcı kavrayış ritmi
dikkat dağılması önleme
metinsel veri entegrasyonu
zihin uyanıklığı seviyesi
hızlı kod çözme
görsel merkezleme becerisi
anlamsal bağlantı kurma
derin konsantrasyon alanı
kesintisiz bilgi akışı
aktif zihin koordinasyonu
satır başı odaklanması
optik algı sürati
bilgi işleme kapasitesi
zihinsel çeviklik artırımı
bütüncül bakış disiplini
kelime tanıma hızı
analitik süzgeç kullanımı
seri kavrayış kabiliyeti
göz kası kontrolü
düşünsel esneklik alanı
statik bakış kırılması
bellek konsolidasyon süreci
hızlı kavram eşleştirme
odak kayması engelleme
dinamik görsel izleme
anlamsal sentez yetisi
derin bellek erişimi
periferik görüş genişletme
akıcı metin çözümleme
zihinsel berraklık hali
göz atlama çevikliği
yüksek kavrayış potansiyeli
`
};

let loadedTxtFiles = [];
let wordPairsList = [];
let expandingSquareList = [];
let expandingCircleList = [];
let cornerJumpList = [];
let tachiPools = { 1: [], 2: [], 3: [] };
let meaningTrainingList = [];
let speedTestsPool = [];
let siteMetinleriLoaded = false;
let txtDiscoveryPromise = null;

const activeExerciseDecks = {};
const lastDrawnItemPerDeck = {};

const FALLBACK_VIDEOS = EMBEDDED_SITE_METINLERI.egitim_videolari;
const FALLBACK_FAQ = EMBEDDED_SITE_METINLERI.sikca_sorulan_sorular || [];

const FALLBACK_READING_TEXT = {
  id: "metin_1",
  fileName: "Göz ve Beyin Uyumunun Gücü",
  title: "Göz ve Beyin Uyumunun Gücü",
  tier: "all",
  content: "Göz kaslarımız ve beynin görsel algı merkezi uyum içinde çalıştığında okuma hızımız doğal biçimde iki katına çıkar. Klasik okuma alışkanlığına sahip bir okuyucu satır üzerindeki her kelimede tek tek duraksarken, okülomotor göz egzersizleriyle eğitilmiş bir okuyucu kelimeleri ikili ve üçlü bloklar halinde fotoğraflar. İç seslendirmeyi azaltmak, satır başı ve satır sonu sekmelerini ritmik hale getirmek ve çevresel görme alanını genişletmek hem okuma hızını hem de metin üzerindeki odaklanma ve anlama oranını kalıcı olarak yükseltir. Odaklanan bir zihin dikkat dağılması yaşamadan metnin ana fikrini çok daha bütünsel ve hızlı biçimde kavrar.",
  questions: [
    { q: '1. Metne göre okuma hızının iki katına çıkmasını sağlayan temel uyum nedir?', options: ['Sadece dudakları hızlı oynatmak', 'Göz kasları ve beynin görsel algı merkezinin uyumu', 'Kelimeleri yüksek sesle okumak', 'Satır başlarında uzun süre beklemek'], answerIndex: 1 },
    { q: '2. Eğitilmiş bir okuyucu kelimeleri nasıl algılar?', options: ['Harf harf heceleyerek', 'İkili ve üçlü bloklar halinde fotoğraflayarak', 'Sadece son kelimelere bakarak', 'İçinden tekrar ederek'], answerIndex: 1 },
    { q: '3. İç seslendirmeyi azaltmak ve çevresel görmeyi genişletmek neyi sağlar?', options: ['Okuma hızını ve anlama oranını artırır', 'Gözlerin daha çabuk yorulmasını sağlar', 'Metnin unutulmasına yol açar', 'Okuma hızını düşürür'], answerIndex: 0 },
    { q: '4. Klasik okuma alışkanlığına sahip bir okuyucunun davranışı nedir?', options: ['Sayfayı tek bakışta okumak', 'Satır üzerindeki her kelimede tek tek duraksamak', 'Hiç duraksamadan taramak', 'Sadece başlıkları okumak'], answerIndex: 1 },
    { q: '5. Odaklanan bir zihin metni nasıl kavrar?', options: ['Dikkat dağılması yaşamadan ana fikri bütünsel kavrar', 'Kelimeleri birbirine karıştırır', 'Sadece ilk paragrafı hatırlar', 'Anlamakta zorlanır'], answerIndex: 0 }
  ]
};

function resetExerciseDecks() {
  Object.keys(activeExerciseDecks).forEach(k => delete activeExerciseDecks[k]);
}

function stripLegacyTxtPrefix(titleStr, fallbackIndex = 1) {
  const cleaned = String(titleStr || '')
    .replace(/^metin\d+\.txt\s*[-—:]?\s*/i, '')
    .replace(/\.txt$/i, '')
    .trim();
  return cleaned || `${fallbackIndex}. Okuma Metni`;
}

/* TEKRARSIZ KARIŞIK ÇEKİLİŞ MOTORU (Fisher-Yates Shuffle) */
function drawUniqueItemFromPool(deckKey, sourceArray) {
  if (!Array.isArray(sourceArray) || sourceArray.length === 0) return null;
  if (sourceArray.length === 1) return sourceArray[0];

  if (!activeExerciseDecks[deckKey] || activeExerciseDecks[deckKey].length === 0) {
    const copy = sourceArray.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }

    const lastItem = lastDrawnItemPerDeck[deckKey];
    if (lastItem !== undefined && copy.length > 1) {
      const topItem = copy[copy.length - 1];
      const isSame = (typeof topItem === 'object' && topItem !== null && typeof lastItem === 'object' && lastItem !== null)
        ? ((topItem.id && lastItem.id) ? topItem.id === lastItem.id : topItem.title === lastItem.title)
        : topItem === lastItem;
      if (isSame) {
        const swapIdx = Math.floor(Math.random() * (copy.length - 1));
        const temp = copy[copy.length - 1];
        copy[copy.length - 1] = copy[swapIdx];
        copy[swapIdx] = temp;
      }
    }

    activeExerciseDecks[deckKey] = copy;
  }

  const drawn = activeExerciseDecks[deckKey].pop();
  lastDrawnItemPerDeck[deckKey] = drawn;
  return drawn;
}

function cleanRawFileContent(rawStr) {
  if (!rawStr) return '';
  const cleaned = String(rawStr).replace(/^\uFEFF/, '').trim();
  if (!cleaned) return '';
  const lower = cleaned.slice(0, 150).toLowerCase();
  if (lower.startsWith('<!doctype html') || lower.startsWith('<html') || lower.includes('<title>404')) {
    return '';
  }
  return cleaned;
}

function cleanInlineFootnotes(textStr) {
  return String(textStr || '')
    .replace(/([a-zA-ZçğıöşüÇĞİÖŞÜâîûÂÎÛ])\d+([a-zA-ZçğıöşüÇĞİÖŞÜâîûÂÎÛ]*)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchSingleCandidateUrl(candidateUrl) {
  if (window.location.protocol !== 'file:') {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const tId = controller ? setTimeout(() => controller.abort(), 2500) : null;
      const resp = await fetch(candidateUrl, {
        cache: 'no-store',
        signal: controller ? controller.signal : undefined
      });
      if (tId) clearTimeout(tId);
      if (resp.status === 404) return null;
      if (resp.ok) {
        const text = cleanRawFileContent(await resp.text());
        if (text) return text;
      }
    } catch (e) {}
  }
  return null;
}

/*****************************************************************
 * SİTE METİNLERİ YÜKLEYİCİ (GÖMÜLÜ VERİ + HARİCİ site_metinleri.json)
 *****************************************************************/
function extractYoutubeVideoId(linkOrId) {
  const str = String(linkOrId || '').trim();
  if (!str) return '';
  const shortsMatch = str.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  const watchMatch = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortUrlMatch = str.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortUrlMatch) return shortUrlMatch[1];
  const embedMatch = str.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return /^[a-zA-Z0-9_-]{11}$/.test(str) ? str : '';
}

function applySiteMetinleriObject(dataObj) {
  if (!dataObj || typeof dataObj !== 'object') return;

  if (typeof INTRO_VIDEOS !== 'undefined') {
    if (Array.isArray(dataObj.egitim_videolari) && dataObj.egitim_videolari.length > 0) {
      const normalized = dataObj.egitim_videolari.map((v, idx) => {
        const validId = extractYoutubeVideoId(v.id) || extractYoutubeVideoId(v.url) || (FALLBACK_VIDEOS[idx] ? FALLBACK_VIDEOS[idx].id : 'fGHJg8VV4EY');
        return {
          order: v.order || (idx + 1),
          title: v.title || `Ders ${idx + 1}`,
          id: validId,
          url: `https://www.youtube.com/shorts/${validId}`
        };
      });
      INTRO_VIDEOS = normalized;
    } else if (!INTRO_VIDEOS || INTRO_VIDEOS.length === 0) {
      INTRO_VIDEOS = FALLBACK_VIDEOS;
    }
  }

  if (typeof FAQ_ITEMS !== 'undefined') {
    if (Array.isArray(dataObj.sikca_sorulan_sorular) && dataObj.sikca_sorulan_sorular.length > 0) {
      FAQ_ITEMS = dataObj.sikca_sorulan_sorular;
    } else if (!FAQ_ITEMS || FAQ_ITEMS.length === 0) {
      FAQ_ITEMS = FALLBACK_FAQ;
    }
  }

  if (typeof LEGAL_DOCUMENTS !== 'undefined' && dataObj.yasal_metinler) {
    ['kvkk', 'terms', 'privacy', 'sales'].forEach(k => {
      if (dataObj.yasal_metinler[k]) {
        LEGAL_DOCUMENTS[k] = {
          title: dataObj.yasal_metinler[k].title || LEGAL_DOCUMENTS[k]?.title || '',
          html: dataObj.yasal_metinler[k].html || ''
        };
      }
    });
  }
}

function applyEmbeddedSiteMetinleriSync() {
  applySiteMetinleriObject(EMBEDDED_SITE_METINLERI);
}

async function ensureSiteMetinleriLoaded() {
  applyEmbeddedSiteMetinleriSync();
  if (!siteMetinleriLoaded && window.location.protocol !== 'file:') {
    try {
      const rawJson = await fetchSingleCandidateUrl('./site_metinleri.json') || await fetchSingleCandidateUrl('./site_metinleri/site_metinleri.json');
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        applySiteMetinleriObject(parsed);
      }
    } catch (e) {}
  }
  siteMetinleriLoaded = true;
  if (typeof renderVideoStudio === 'function') renderVideoStudio();
  if (typeof renderFaqSection === 'function') renderFaqSection();
}

/*****************************************************************
 * ANTRENMAN KELİME VE SORU ÜRETİCİLERİ
 *****************************************************************/
function parsePairLines(rawText) {
  return String(rawText || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(line => {
      if (/[,|;\t]/.test(line)) {
        return line.split(/[,|;\t]+/).map(w => w.trim()).filter(Boolean);
      }
      return line.split(/\s+/).map(w => w.trim()).filter(Boolean);
    })
    .filter(arr => arr.length >= 2);
}

function parseQuadLines(rawText) {
  return String(rawText || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(line => {
      if (/[,|;\t]/.test(line)) {
        return line.split(/[,|;\t]+/).map(w => w.trim()).filter(Boolean);
      }
      return line.split(/\s+/).map(w => w.trim()).filter(Boolean);
    })
    .filter(arr => arr.length >= 4);
}

function placeCorrectOptionAt(correctText, distractors, targetIdx) {
  const opts = distractors.slice(0, 3);
  const idx = Math.max(0, Math.min(3, targetIdx));
  opts.splice(idx, 0, correctText);
  return { options: opts, answerIndex: idx };
}

function buildQuestionsFromPassageContent(contentStr, seedIdx = 0) {
  const sentences = String(contentStr || '')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25);

  const shorten = (s, maxLen = 76) => {
    const clean = String(s || '').replace(/[.!?]+$/, '').trim();
    return clean.length > maxLen ? clean.slice(0, maxLen).trim() + '...' : clean;
  };

  const s0 = shorten(sentences[0] || 'Metinde hızlı okuma ve odaklanma ilkeleri ele alınmaktadır.');
  const sMid = shorten(sentences[Math.floor(sentences.length / 2)] || s0);
  const sLast = shorten(sentences[sentences.length - 1] || s0);

  const q1Pack = placeCorrectOptionAt(
    s0,
    [
      'Okuma sırasında her kelimede uzun süre duraksanması gerektiği',
      'Görsel algının okuma hızı üzerinde hiçbir etkisinin bulunmadığı',
      'Metinlerin yalnızca son paragrafına bakılarak anlaşılacağı'
    ],
    (seedIdx + 1) % 4
  );

  const q2Pack = placeCorrectOptionAt(
    sMid,
    [
      'Kelimeleri tek tek hecelemenin odaklanmayı kolaylaştırdığı',
      'Okuma hızı arttıkça çalışma belleğinin tamamen kapandığı',
      'Satır sonu geçişlerinde gözleri dinlendirmek için beklenilmesi gerektiği'
    ],
    (seedIdx + 2) % 4
  );

  const q3Pack = placeCorrectOptionAt(
    sLast,
    [
      'Blok okuma tekniğinin yalnızca kısa metinlerde uygulanabileceği',
      'Çevresel görme alanının eğitimle geliştirilemeyeceği',
      'İç seslendirmenin okuma hızını iki katına çıkardığı'
    ],
    (seedIdx + 3) % 4
  );

  const q4Pack = placeCorrectOptionAt(
    'Metindeki olay örgüsünü ve ana düşünceyi dikkat dağılmadan bütünsel kavramak',
    [
      'Kelimeleri yüksek sesle telaffuz ederek yavaş ilerlemek',
      'Her satırı en az iki kez geriye dönerek tekrar okumak',
      'Noktalama işaretlerini ve paragraf yapısını göz ardı etmek'
    ],
    seedIdx % 4
  );

  const q5Pack = placeCorrectOptionAt(
    'Göz ve zihin koordinasyonuyla hem okuma hızını hem de anlama derinliğini artırmayı',
    [
      'İç seslendirmeyi artırarak konuşma hızında kalmayı',
      'Yalnızca bildiğimiz kelimeleri okuyup diğerlerini atlamayı',
      'Metnin bütününü yerine sadece tekil harfleri incelemeyi'
    ],
    (seedIdx + 1) % 4
  );

  return [
    { q: '1. Okuduğunuz metnin giriş bölümünde vurgulanan temel ifade aşağıdakilerden hangisidir?', options: q1Pack.options, answerIndex: q1Pack.answerIndex },
    { q: '2. Metnin gelişme bölümünde aşağıdakilerden hangisi doğrudan aktarılmaktadır?', options: q2Pack.options, answerIndex: q2Pack.answerIndex },
    { q: '3. Metnin sonuç bölümünde ulaşılan yargı aşağıdakilerden hangisidir?', options: q3Pack.options, answerIndex: q3Pack.answerIndex },
    { q: '4. Okuduğunuz metnin anlatım bütünlüğüne göre okuyucunun odaklanması gereken temel unsur nedir?', options: q4Pack.options, answerIndex: q4Pack.answerIndex },
    { q: '5. Bu metni okurken uygulanan etkin okuma disiplini aşağıdakilerden hangisini destekler?', options: q5Pack.options, answerIndex: q5Pack.answerIndex }
  ];
}

function normalizeTextRecord(rawItem, indexZero = 0) {
  const cleanTitle = stripLegacyTxtPrefix(rawItem.title || rawItem.fileName || '', indexZero + 1);
  const cleanContent = cleanInlineFootnotes(rawItem.content || '');
  const id = rawItem.id || `metin_${indexZero + 1}`;
  const tier = rawItem.tier || 'all';
  const questions = (Array.isArray(rawItem.questions) && rawItem.questions.length >= 5)
    ? rawItem.questions.slice(0, 5)
    : buildQuestionsFromPassageContent(cleanContent, indexZero);

  return {
    id,
    title: cleanTitle,
    fileName: cleanTitle,
    tier,
    content: cleanContent,
    questions,
    updatedAt: rawItem.updatedAt || Date.now()
  };
}

/*****************************************************************
 * 3. metinler.db VERİTABANI OKUMA VE KAYDETME MOTORU
 * (TÜM METİNLER SADECE metinler.db DOSYASINDAN OKUNUR VE ORAYA YAZILIR)
 *****************************************************************/
function parseMetinlerDbRawText(rawStr) {
  if (!rawStr) return null;
  const cleaned = String(rawStr)
    .trim()
    .replace(/^window\.__METINLER_DB__\s*=\s*/, '')
    .replace(/;\s*$/, '');
  return JSON.parse(cleaned);
}

function serializeMetinlerDbPayload(payloadObj) {
  return 'window.__METINLER_DB__ = ' + JSON.stringify(payloadObj, null, 2) + ';\n';
}

function buildLocalDbPayload(textsArray) {
  return {
    dbFormat: '2X_METINLER_DB_V3',
    dbFileName: LOCAL_DB_FILENAME,
    updatedAt: Date.now(),
    totalTexts: Array.isArray(textsArray) ? textsArray.length : 0,
    texts: (textsArray || []).map((t, idx) => normalizeTextRecord(t, idx))
  };
}

function getTextsFromLoadedMetinlerDb() {
  if (window.__METINLER_DB__ && Array.isArray(window.__METINLER_DB__.texts) && window.__METINLER_DB__.texts.length > 0) {
    return window.__METINLER_DB__.texts.map((entry, idx) => normalizeTextRecord(entry, idx));
  }
  return [];
}

async function persistTextsToLocalDatabase(textsArray) {
  const normalizedList = (textsArray || []).map((t, idx) => normalizeTextRecord(t, idx));
  loadedTxtFiles = normalizedList;
  speedTestsPool = normalizedList;
  resetExerciseDecks();

  const payload = buildLocalDbPayload(normalizedList);
  window.__METINLER_DB__ = payload;
  const dbContent = serializeMetinlerDbPayload(payload);

  // 1. Yerel sunucu açıksa doğrudan metinler.db dosyasına yaz
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    try {
      const putRes = await fetch(`./${LOCAL_DB_FILENAME}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
        body: dbContent
      });
      if (putRes && putRes.ok) return normalizedList;
    } catch (e) {}
  }

  // 2. Doğrudan klasördeki metinler.db dosyasına kaydet (File System Access API)
  if (window.showSaveFilePicker) {
    try {
      if (!localDbFileHandle) {
        localDbFileHandle = await window.showSaveFilePicker({
          suggestedName: LOCAL_DB_FILENAME,
          types: [{ description: 'Metin Veritabanı (metinler.db)', accept: { 'application/octet-stream': ['.db'] } }]
        });
      }
      const writable = await localDbFileHandle.createWritable();
      await writable.write(dbContent);
      await writable.close();
      return normalizedList;
    } catch (e) {}
  }

  return normalizedList;
}

/* SAYFA YÜKLENİR YÜKLENMEZ SENKRON BAŞLATMA */
function initializeEmbeddedExercisePoolsSync() {
  applyEmbeddedSiteMetinleriSync();

  wordPairsList = parsePairLines(EMBEDDED_EXERCISE_POOLS['kelime_acilimi']);
  expandingSquareList = parseQuadLines(EMBEDDED_EXERCISE_POOLS['genisleyen_kare']);
  expandingCircleList = parseQuadLines(EMBEDDED_EXERCISE_POOLS['genisleyen_yuvarlak']);

  cornerJumpList = EMBEDDED_EXERCISE_POOLS['capraz_kose']
    .split(/\r?\n/)
    .map(s => s.replace(/,/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  [1, 2, 3].forEach(lvl => {
    const key = `takistoskop_${lvl}`;
    tachiPools[lvl] = (EMBEDDED_EXERCISE_POOLS[key] || '')
      .split(/\r?\n/)
      .map(s => s.replace(/,/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  });

  const parsedMeaning = [];
  (EMBEDDED_EXERCISE_POOLS['anlam_antrenmani'] || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).forEach(line => {
    const parts = line.split('|');
    if (parts.length >= 2) {
      const flag = parts[1].trim().toLowerCase();
      const cleanWords = parts[0].replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
      parsedMeaning.push({
        words: cleanWords,
        isMeaningful: (flag === '1' || flag === 'true' || flag === 'evet' || flag === 'anlamlı' || flag === 'anlamli')
      });
    }
  });
  meaningTrainingList = parsedMeaning;

  // Metinleri doğrudan metinler.db (window.__METINLER_DB__) içerisinden yükle
  const initialTexts = getTextsFromLoadedMetinlerDb();
  loadedTxtFiles = initialTexts;
  speedTestsPool = initialTexts;
  resetExerciseDecks();
}

initializeEmbeddedExercisePoolsSync();

async function autoDiscoverTxtFiles() {
  if (txtDiscoveryPromise) return txtDiscoveryPromise;

  txtDiscoveryPromise = (async () => {
    if (window.location.protocol !== 'file:') {
      try {
        const rawFileDb = await fetchSingleCandidateUrl(`./${LOCAL_DB_FILENAME}`);
        if (rawFileDb) {
          const parsedFile = parseMetinlerDbRawText(rawFileDb);
          if (parsedFile && Array.isArray(parsedFile.texts) && parsedFile.texts.length > 0) {
            window.__METINLER_DB__ = parsedFile;
            loadedTxtFiles = parsedFile.texts.map((t, i) => normalizeTextRecord(t, i));
            speedTestsPool = loadedTxtFiles;
            resetExerciseDecks();
            return;
          }
        }
      } catch (e) {}
    }

    const fromWindowDb = getTextsFromLoadedMetinlerDb();
    if (fromWindowDb.length > 0) {
      loadedTxtFiles = fromWindowDb;
      speedTestsPool = fromWindowDb;
      resetExerciseDecks();
    }
  })();

  return txtDiscoveryPromise;
}

function resolveActiveTierKeyForUserAndStage() {
  try {
    if (typeof appState !== 'undefined' && appState) {
      const st = Number(appState.currentStage) || 0;
      if (st >= 101 && st <= 105) {
        const tIdx = st - 100;
        const mapByTier = { 1: 'ilkokul', 2: 'ortaokul', 3: 'lise', 4: 'universite', 5: 'yetiskin' };
        if (mapByTier[tIdx]) return mapByTier[tIdx];
      }
      if (st >= 1 && st <= 30 && typeof getStageConfig === 'function') {
        const cfg = getStageConfig(st);
        const clsId = cfg && cfg.classificationId;
        const mapByCls = {
          slow: 'ilkokul', ilkokul: 'ilkokul',
          tr_avg: 'ortaokul', ortaokul: 'ortaokul',
          normal: 'lise', lise: 'lise',
          fast: 'universite', universite: 'universite',
          pro: 'yetiskin', yetiskin: 'yetiskin'
        };
        if (clsId && mapByCls[clsId]) return mapByCls[clsId];
      }
    }
    if (typeof currentUser !== 'undefined' && currentUser) {
      const rawLvl = String(currentUser.level || currentUser.seviye || '').toLowerCase();
      if (rawLvl.includes('ilkokul')) return 'ilkokul';
      if (rawLvl.includes('ortaokul')) return 'ortaokul';
      if (rawLvl.includes('lise')) return 'lise';
      if (rawLvl.includes('üniversite') || rawLvl.includes('universite') || rawLvl.includes('kpss')) return 'universite';
      if (rawLvl.includes('yetişkin') || rawLvl.includes('yetiskin')) return 'yetiskin';
    }
  } catch (e) {}
  return 'all';
}

function getFilteredPoolForCurrentContext(basePool) {
  const pool = Array.isArray(basePool) && basePool.length > 0 ? basePool : loadedTxtFiles;
  if (!Array.isArray(pool) || pool.length === 0) return [];
  const targetTier = resolveActiveTierKeyForUserAndStage();
  if (!targetTier || targetTier === 'all') return pool;
  const matched = pool.filter(item => {
    const t = String(item.tier || 'all').toLowerCase();
    return t === targetTier || t === 'all';
  });
  return matched.length > 0 ? matched : pool;
}

function getUniqueReadingText() {
  const activeTier = resolveActiveTierKeyForUserAndStage();
  const pool = getFilteredPoolForCurrentContext(loadedTxtFiles);
  const item = drawUniqueItemFromPool(`reading_texts_${activeTier}`, pool);
  if (item && item.content) return item;
  return FALLBACK_READING_TEXT;
}

function getUniqueStage14ReadingText() {
  return getUniqueReadingText();
}

function getUniqueSpeedTestWithQuestions() {
  const activeTier = resolveActiveTierKeyForUserAndStage();
  const basePool = loadedTxtFiles.length > 0 ? loadedTxtFiles : speedTestsPool;
  const pool = getFilteredPoolForCurrentContext(basePool);
  const item = drawUniqueItemFromPool(`speedtest_deck_${activeTier}`, pool);
  if (item && item.content) {
    const cleanTitle = stripLegacyTxtPrefix(item.title || item.fileName || '');
    return {
      id: item.id || 'metin_1',
      fileName: cleanTitle,
      title: cleanTitle,
      tier: item.tier || activeTier,
      content: item.content,
      questions: (Array.isArray(item.questions) && item.questions.length > 0)
        ? item.questions
        : buildQuestionsFromPassageContent(item.content)
    };
  }
  return FALLBACK_READING_TEXT;
}

function getUniqueWordPair() {
  const pair = drawUniqueItemFromPool('kelime_acilimi', wordPairsList);
  if (pair && pair.length >= 2) return pair;
  return ['hızlı', 'okuma'];
}

function getUniqueExpandingSquareWords() {
  const quad = drawUniqueItemFromPool('genisleyen_kare', expandingSquareList);
  if (quad && quad.length >= 4) return quad;
  const p1 = getUniqueWordPair();
  const p2 = getUniqueWordPair();
  return [p1[0], p1[1], p2[0], p2[1]];
}

function getUniqueExpandingCircleWords() {
  const quad = drawUniqueItemFromPool('genisleyen_yuvarlak', expandingCircleList);
  if (quad && quad.length >= 4) return quad;
  const p1 = getUniqueWordPair();
  const p2 = getUniqueWordPair();
  return [p1[0], p1[1], p2[0], p2[1]];
}

function getUniqueCornerWord() {
  const w = drawUniqueItemFromPool('capraz_kose', cornerJumpList);
  if (w) return w;
  return getUniqueTachiWord(1);
}

function getUniqueTachiWord(level) {
  const pool = (tachiPools[level] && tachiPools[level].length > 0) ? tachiPools[level] : tachiPools[1];
  const w = drawUniqueItemFromPool(`tachi_lvl_${level}`, pool);
  return String(w || 'odaklanma').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
}

function getUniqueMeaningItem() {
  const item = drawUniqueItemFromPool('anlam_antrenmani', meaningTrainingList);
  if (item && item.words) {
    return {
      words: String(item.words).replace(/,/g, ' ').replace(/\s+/g, ' ').trim(),
      isMeaningful: !!item.isMeaningful
    };
  }
  return { words: 'kitap defter kalem', isMeaningful: true };
}

function getUniqueColumnChunks(chunkSize, count = 18) {
  const txtObj = getUniqueReadingText();
  let allWords = (txtObj && txtObj.content) ? txtObj.content.trim().split(/\s+/).filter(Boolean) : [];
  if (allWords.length < count * chunkSize && loadedTxtFiles.length > 1) {
    const extraTxt = getUniqueReadingText();
    if (extraTxt && extraTxt.content) {
      allWords = allWords.concat(extraTxt.content.trim().split(/\s+/).filter(Boolean));
    }
  }
  if (allWords.length < count * chunkSize) {
    const fbWords = FALLBACK_READING_TEXT.content.split(/\s+/);
    allWords = allWords.concat(fbWords, fbWords);
  }
  const chunkPool = [];
  for (let i = 0; i + chunkSize <= allWords.length; i += chunkSize) {
    chunkPool.push(allWords.slice(i, i + chunkSize).join(' '));
  }
  const selected = [];
  for (let c = 0; c < count; c++) {
    const chunk = drawUniqueItemFromPool(`sutun_chunks_${chunkSize}`, chunkPool);
    selected.push(chunk || 'hızlı okuma');
  }
  return selected;
}
