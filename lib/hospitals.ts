export interface Hospital {
  name: string;
  nameKo: string;
  specialty: string;
  location: string;
  desc: string;
  website: string;
  image: string;
  rating: number;
  reviews: string;
  patients: string;
}

export const hospitals: Hospital[] = [
  {
    name: 'Asan Medical Center',
    nameKo: '서울아산병원',
    specialty: 'Comprehensive Care',
    location: 'Seoul · Songpa',
    desc: 'Korea\u2019s largest single hospital, renowned for organ transplantation, oncology and full-spectrum multi-specialty care.',
    website: 'https://english.amc.seoul.kr',
    rating: 4.8,
    reviews: '3,200+',
    patients: '3.1M patients / year',
    image:
      'https://readdy.ai/api/search-image?query=Professional%20architectural%20photography%20of%20a%20large%20modern%20university%20medical%20center%20complex%20in%20Seoul%20South%20Korea%20with%20a%20clean%20glass%20and%20stone%20facade%2C%20warm%20natural%20sunlight%2C%20landscaped%20entrance%20with%20trees%20and%20a%20clear%20blue%20sky%2C%20calm%20reassuring%20premium%20atmosphere%2C%20high%20end%20healthcare%20architecture%20photography%20style%20with%20crisp%20natural%20colors%20and%20clean%20simple%20composition&width=800&height=600&seq=8101&orientation=landscape',
  },
  {
    name: 'Samsung Medical Center',
    nameKo: '삼성서울병원',
    specialty: 'Cancer & Cardiology',
    location: 'Seoul · Gangnam',
    desc: 'A global leader in cancer treatment and cardiovascular care, equipped with advanced robotic and precision surgery.',
    website: 'https://www.samsunghospital.com',
    rating: 4.9,
    reviews: '2,800+',
    patients: '2.4M patients / year',
    image:
      'https://readdy.ai/api/search-image?query=Professional%20architectural%20photography%20of%20a%20sleek%20modern%20specialized%20cancer%20and%20cardiology%20hospital%20building%20in%20Seoul%20South%20Korea%20with%20a%20curved%20glass%20facade%20and%20warm%20interior%20lighting%2C%20landscaped%20plaza%20entrance%20and%20clear%20blue%20sky%2C%20calm%20reassuring%20premium%20atmosphere%2C%20high%20end%20healthcare%20architecture%20photography%20style%20with%20crisp%20natural%20colors%20and%20clean%20simple%20composition&width=800&height=600&seq=8102&orientation=landscape',
  },
  {
    name: 'Seoul National University Hospital',
    nameKo: '서울대학교병원',
    specialty: 'Research & Rare Diseases',
    location: 'Seoul · Jongno',
    desc: 'A prestigious academic research hospital and leader in rare diseases, precision medicine and complex procedures.',
    website: 'https://www.snuh.org',
    rating: 4.7,
    reviews: '2,100+',
    patients: '2.0M patients / year',
    image:
      'https://readdy.ai/api/search-image?query=Professional%20architectural%20photography%20of%20a%20prestigious%20academic%20research%20hospital%20in%20Seoul%20South%20Korea%20with%20a%20modern%20stone%20and%20glass%20facade%2C%20a%20landscaped%20garden%20courtyard%20with%20walking%20paths%20and%20warm%20natural%20light%2C%20clear%20blue%20sky%2C%20calm%20reassuring%20premium%20atmosphere%2C%20high%20end%20healthcare%20architecture%20photography%20style%20with%20crisp%20natural%20colors%20and%20clean%20simple%20composition&width=800&height=600&seq=8103&orientation=landscape',
  },
  {
    name: 'Severance Hospital',
    nameKo: '세브란스병원',
    specialty: 'Full-Spectrum Care',
    location: 'Seoul · Seodaemun',
    desc: 'One of Korea\u2019s oldest and most trusted hospitals, offering comprehensive care with a dedicated international clinic.',
    website: 'https://sev.iseverance.com',
    rating: 4.6,
    reviews: '3,500+',
    patients: '2.7M patients / year',
    image:
      'https://readdy.ai/api/search-image?query=Professional%20architectural%20photography%20of%20an%20elegant%20established%20university%20hospital%20in%20Seoul%20South%20Korea%20combining%20modern%20glass%20wings%20with%20a%20classic%20red%20brick%20heritage%20facade%2C%20landscaped%20entrance%20and%20warm%20natural%20sunlight%2C%20calm%20reassuring%20premium%20atmosphere%2C%20high%20end%20healthcare%20architecture%20photography%20style%20with%20crisp%20natural%20colors%20and%20clean%20simple%20composition&width=800&height=600&seq=8104&orientation=landscape',
  },
  {
    name: 'CHAUM',
    nameKo: '차움',
    specialty: 'Executive Health Checkup',
    location: 'Seoul · Gangnam',
    desc: 'A premium anti-aging and executive health screening center offering luxury concierge-style wellness programs.',
    website: 'https://www.chaum.net',
    rating: 4.9,
    reviews: '1,400+',
    patients: '180K+ checkups / year',
    image:
      'https://readdy.ai/api/search-image?query=Professional%20interior%20photography%20of%20a%20luxury%20premium%20wellness%20and%20health%20checkup%20center%20lobby%20in%20Gangnam%20Seoul%20South%20Korea%20with%20warm%20ambient%20lighting%2C%20elegant%20marble%20floors%2C%20comfortable%20lounge%20seating%20and%20soft%20natural%20light%2C%20calm%20reassuring%20spa-like%20premium%20atmosphere%2C%20high%20end%20interior%20photography%20style%20with%20crisp%20natural%20colors%20and%20clean%20simple%20composition&width=800&height=600&seq=8105&orientation=landscape',
  },
  {
    name: 'JK Plastic Surgery Center',
    nameKo: 'JK성형외과',
    specialty: 'Cosmetic Surgery',
    location: 'Seoul · Gangnam',
    desc: 'A world-famous cosmetic surgery center with a dedicated international patient department and board-certified surgeons.',
    website: 'https://www.jkplastic.com',
    rating: 4.9,
    reviews: '5,600+',
    patients: '60K+ surgeries / year',
    image:
      'https://readdy.ai/api/search-image?query=Professional%20architectural%20photography%20of%20a%20modern%20elegant%20cosmetic%20surgery%20clinic%20building%20in%20Gangnam%20Seoul%20South%20Korea%20with%20a%20clean%20white%20glass%20facade%2C%20soft%20warm%20lighting%20and%20a%20welcoming%20landscaped%20entrance%2C%20calm%20reassuring%20premium%20atmosphere%2C%20high%20end%20healthcare%20architecture%20photography%20style%20with%20crisp%20natural%20colors%20and%20clean%20simple%20composition&width=800&height=600&seq=8106&orientation=landscape',
  },
];